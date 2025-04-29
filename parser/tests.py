from django.test import TestCase, Client
from django.urls import reverse
import json

class EventParserTests(TestCase):
    def setUp(self):
        self.client = Client()

    def test_skydeck_event_parsing(self):
        event_text = """Batch 20 Kick Off & Orientation 
 Date: May 5, 9:15am-6pm  
 Description: Welcome to SkyDeck! During this event we will introduce you to SkyDeck staff, your fellow founders, and get you familiar with upcoming SkyDeck programming. The evening will end with a welcome happy hour in Berkeley."""

        response = self.client.post(
            reverse('parse_event'),
            data=json.dumps({'text': event_text}),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, 200, 'Expected successful response, got error status code')
        
        try:
            data = json.loads(response.content)
        except json.JSONDecodeError as e:
            self.fail(f'Failed to parse response JSON: {str(e)}\nResponse content: {response.content}')
        
        self.assertIn('events', data, 'Response missing "events" key in data')
        self.assertNotIn('error', data, f'Response contains error: {data.get("error", "")}')        
        
        events = data['events']
        self.assertIsInstance(events, list, 'Events data is not a list')
        self.assertEqual(len(events), 1, 'Expected 1 event, got different number')
        
        # Test the single event
        event = events[0]
        self.assertIsInstance(event, dict, 'Event data is not a dictionary')
        
        # Validate all required fields are present
        required_fields = ['title', 'date', 'time', 'location', 'description']
        for field in required_fields:
            self.assertIn(field, event, f'Event missing required field: {field}')
            self.assertTrue(event[field], f'Field {field} should not be empty')
        
        # Only validate date and time exactly
        self.assertEqual(
            event['date'], 
            '2025-05-05',
            f'Date mismatch. Expected "2025-05-05", got "{event.get("date", "<missing>")}"'
        )
        self.assertEqual(
            event['time'], 
            '09:15-18:00',
            f'Time mismatch. Expected "09:15-18:00", got "{event.get("time", "<missing>")}"'
        )

    def test_multiple_events_parsing(self):
        event_text = """
 Batch 20 Kick Off & Orientation 
 Date: May 5, 9:15am-6pm  
 Description: Welcome to SkyDeck! During this event we will introduce you to SkyDeck staff, your fellow founders, and get you familiar with upcoming SkyDeck programming. The evening will end with a welcome happy hour in Berkeley. 
 
 Welcome to SkyDeck! UC Berkeley Campus Tour & Lunch 
 Date: May 6, 11:15am – 1pm 
 Description: Join SkyDeck staff as they give you a tour of the UC Berkeley campus. Get to know your fellow founders on the tour and over lunch.


 """

        response = self.client.post(
            reverse('parse_event'),
            data=json.dumps({'text': event_text}),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, 200, 'Expected successful response')
        
        try:
            data = json.loads(response.content)
        except json.JSONDecodeError as e:
            self.fail(f'Failed to parse response JSON: {str(e)}\nResponse content: {response.content}')
        
        self.assertIn('events', data, 'Response missing "events" key')
        self.assertNotIn('error', data, f'Response contains error: {data.get("error", "")}')
        
        events = data['events']
        self.assertIsInstance(events, list, 'Events data is not a list')
        self.assertEqual(len(events), 2, 'Expected 2 events, got different number')
        
        expected_events = [
            {
                'date': '2025-05-05',
                'time': '09:15-18:00',
                'title': 'Batch 20 Kick Off & Orientation',
                'description': 'Welcome to SkyDeck! During this event we will introduce you to SkyDeck staff, your fellow founders, and get you familiar with upcoming SkyDeck programming. The evening will end with a welcome happy hour in Berkeley.'
            },
            {
                'date': '2025-05-06',
                'time': '11:15-13:00',
                'title': 'Welcome to SkyDeck! UC Berkeley Campus Tour & Lunch',
                'description': 'Join SkyDeck staff as they give you a tour of the UC Berkeley campus. Get to know your fellow founders on the tour and over lunch.'
            }
        ]
        
        for i, (event, expected) in enumerate(zip(events, expected_events)):
            # Validate all required fields are present and non-empty
            required_fields = ['title', 'date', 'time', 'location', 'description']
            for field in required_fields:
                self.assertIn(field, event, f'Event {i+1} missing field: {field}')
                self.assertTrue(event[field], f'Event {i+1} field {field} should not be empty')
            
            # Only validate date and time exactly
            self.assertEqual(
                event['date'],
                expected['date'],
                f'Event {i+1} date mismatch. Expected {expected["date"]}, got {event.get("date", "<missing>")}'
            )
            self.assertEqual(
                event['time'],
                expected['time'],
                f'Event {i+1} time mismatch. Expected {expected["time"]}, got {event.get("time", "<missing>")}'
            )

    def test_batch_20_happy_hours(self):
        event_text = """Batch 20 Happy Hours or Dinners 
 Dates: 
 May 5, 4:30 – 6:00pm - SkyDeck Batch 19 Kick Off Happy Hour 
 May 9, 4:30 - 6:00pm - Tipsy Putt mini golf 
 May 22, 5:00 – 6:30pm - Drinks at Caroline's home 
 June 10, 5:00 – 7:00pm - Bio Track Dinner"""

        response = self.client.post(
            reverse('parse_event'),
            data=json.dumps({'text': event_text}),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, 200, 'Expected successful response')
        
        try:
            data = json.loads(response.content)
        except json.JSONDecodeError as e:
            self.fail(f'Failed to parse response JSON: {str(e)}\nResponse content: {response.content}')
        
        self.assertIn('events', data, 'Response missing "events" key')
        self.assertNotIn('error', data, f'Response contains error: {data.get("error", "")}')
        
        events = data['events']
        self.assertIsInstance(events, list, 'Events data is not a list')
        self.assertEqual(len(events), 4, 'Expected 4 events, got different number')
        
        expected_events = [
            {
                'date': '2025-05-05',
                'time': '16:30-18:00',
                'title': 'SkyDeck Batch 19 Kick Off Happy Hour'
            },
            {
                'date': '2025-05-09',
                'time': '16:30-18:00',
                'title': 'Tipsy Putt mini golf'
            },
            {
                'date': '2025-05-22',
                'time': '17:00-18:30',
                'title': 'Drinks at Caroline\'s home'
            },
            {
                'date': '2025-06-10',
                'time': '17:00-19:00',
                'title': 'Bio Track Dinner'
            }
        ]
        
        for i, (event, expected) in enumerate(zip(events, expected_events)):
            # Validate all required fields are present and non-empty
            required_fields = ['title', 'date', 'time']
            for field in required_fields:
                self.assertIn(field, event, f'Event {i+1} missing field: {field}')
                self.assertTrue(event[field], f'Event {i+1} field {field} should not be empty')
            
            # Only validate date and time exactly
            self.assertEqual(
                event['date'],
                expected['date'],
                f'Event {i+1} date mismatch. Expected {expected["date"]}, got {event.get("date", "<missing>")}'
            )
            self.assertEqual(
                event['time'],
                expected['time'],
                f'Event {i+1} time mismatch. Expected {expected["time"]}, got {event.get("time", "<missing>")}'
            )
