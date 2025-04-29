import json
import os
import traceback
from datetime import datetime
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

from datetime import datetime, timezone
from zoneinfo import ZoneInfo

def parse_with_llm(text, timezone_str='UTC'):
    # Strip non-alphanumeric characters from both ends of the input text
    text = text.strip(''.join(c for c in text if not (c.isalnum())))
    # Get current time in the specified timezone
    current_time = datetime.now(ZoneInfo(timezone_str))
    prompt = f"""You are a expert in calendar information. Extract event information from the following text. There may be multiple events. Format the response as a JSON array where each event has these fields:
    - title: The event title
    - description: Event description if available
    - date: Date in YYYY-MM-DD format, if there are multiple times, duplicate the event (it means this event will happen more than once)
    - time: Time in HH:MM-HH:MM format in local timezone, if there are multiple times, duplicate the event (it means this event will happen more than once)
    - location: Location if available

    Input timezone: {timezone_str}
    Current date in {timezone_str}: {current_time.strftime('%Y-%m-%d')}

    Text: {text}

    """

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
        )
        
        # Parse the response and ensure it's valid JSON
        response_content = response.choices[0].message.content
        # Do some cleaning as LLM output sometimes have ``` and json`
        response_content = response_content.replace('```', '') 
        response_content = response_content.replace('json', '')
        try:
            events_data = json.loads(response_content)
            
            # Handle both single event and multiple events
            if not isinstance(events_data, list):
                events_data = [events_data]
            
            # Validate required fields for each event
            required_fields = ['title', 'date', 'time']
            for event in events_data:
                missing_fields = [field for field in required_fields if field not in event]
                if missing_fields:
                    raise ValueError(f"Missing required fields in event: {', '.join(missing_fields)}")
            
            # Return single event or list of events based on input
            if len(events_data) == 1 and '\n\n' not in text:
                return events_data[0]  # Single event
            return events_data  # Multiple events
            
        except json.JSONDecodeError:
            raise ValueError(f"Failed to parse LLM response as JSON: {response_content}")
            
    except Exception as e:
        error_msg = f"Error in parse_with_llm: {str(e)}"
        print(error_msg)  # For development debugging
        raise ValueError(error_msg)

@csrf_exempt
@require_http_methods(["POST"])
def parse_event(request):
    try:
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError as e:
            return JsonResponse({
                "error": "Invalid JSON in request body",
                "detail": str(e),
                "stack_trace": traceback.format_exc()
            }, status=400)
            
        text = data.get('text')
        timezone_str = data.get('timezone', 'UTC')
        if not text:
            return JsonResponse({
                "error": "No text provided",
                "detail": "The 'text' field is required in the request body",
                "stack_trace": traceback.format_exc()
            }, status=400)
        
        try:
            events_data = parse_with_llm(text, timezone_str)
            # If only one event, wrap it in a list for consistent response format
            if not isinstance(events_data, list):
                events_data = [events_data]
            return JsonResponse({"events": events_data})
            
        except ValueError as e:
            return JsonResponse({
                "error": "Event parsing failed",
                "detail": str(e),
                "input_text": text,
                "stack_trace": traceback.format_exc()
            }, status=422)
            
    except Exception as e:
        error_msg = f"Unexpected error: {str(e)}"
        print(f"ERROR in parse_event: {error_msg}")  # For development debugging
        return JsonResponse({
            "error": "Internal server error",
            "detail": error_msg,
            "stack_trace": traceback.format_exc()
        }, status=500)
