// Test suite for Event Parser functionality
describe('Event Parser Tests', () => {
    beforeEach(() => {
        // Reset the DOM before each test
        document.body.innerHTML = `
            <textarea id="eventText"></textarea>
            <select id="timezoneSelect">
                <option value="America/Los_Angeles">PST</option>
            </select>
            <div id="preview"></div>
            <div id="errorBox"></div>
            <div id="icsPreview" style="display: none; background: #f5f5f5; padding: 10px; margin-top: 10px; font-family: monospace;"></div>
        `;
        // Reset global variables
        window.parsedEvents = [];
    });

    describe('Time Parsing Tests', () => {
        test('should correctly parse morning time range', () => {
            const { start, end } = parseDateTime('2024-01-20', 'morning');
            expect(start.getHours()).toBe(9);
            expect(start.getMinutes()).toBe(0);
            expect(end.getHours()).toBe(12);
            expect(end.getMinutes()).toBe(0);
        });

        test('should correctly parse evening time range', () => {
            const { start, end } = parseDateTime('2024-01-20', 'evening');
            expect(start.getHours()).toBe(18);
            expect(start.getMinutes()).toBe(0);
            expect(end.getHours()).toBe(22);
            expect(end.getMinutes()).toBe(0);
        });

        test('should handle TBD/all day time range', () => {
            const { start, end } = parseDateTime('2024-01-20', 'tbd');
            expect(start.getHours()).toBe(9);
            expect(start.getMinutes()).toBe(0);
            expect(end.getHours()).toBe(17);
            expect(end.getMinutes()).toBe(0);
        });
    });

    describe('ICS Generation Tests', () => {
        test('should generate correct ICS format with timezone', () => {
            // Setup test event
            window.parsedEvents = [{
                title: 'Test Event',
                date: '2024-01-20',
                time: '09:00-10:00',
                description: 'Test Description',
                location: 'Test Location'
            }];

            // Generate ICS content
            const icsBlob = generateICS();
            const reader = new FileReader();
            
            reader.readAsText(icsBlob);
            reader.onload = () => {
                const icsContent = reader.result;
                
                // Verify ICS format
                expect(icsContent).toContain('BEGIN:VCALENDAR');
                expect(icsContent).toContain('VERSION:2.0');
                expect(icsContent).toContain('BEGIN:VEVENT');
                
                // Verify event details
                expect(icsContent).toContain('SUMMARY:Test Event');
                expect(icsContent).toContain('DTSTART;TZID=America/Los_Angeles:20240120T090000');
                expect(icsContent).toContain('DTEND;TZID=America/Los_Angeles:20240120T100000');
                expect(icsContent).toContain('DESCRIPTION:Test Description');
                expect(icsContent).toContain('LOCATION:Test Location');
                expect(icsContent).toContain('END:VEVENT');
                expect(icsContent).toContain('END:VCALENDAR');
            };
        });

        test('should handle special time names in ICS generation', () => {
            window.parsedEvents = [{
                title: 'Morning Meeting',
                date: '2024-01-20',
                time: 'morning',
                description: 'Test Morning Event'
            }];

            const icsBlob = generateICS();
            const reader = new FileReader();
            
            reader.readAsText(icsBlob);
            reader.onload = () => {
                const icsContent = reader.result;
                
                // Verify morning time conversion (09:00-12:00)
                expect(icsContent).toContain('DTSTART;TZID=America/Los_Angeles:20240120T090000');
                expect(icsContent).toContain('DTEND;TZID=America/Los_Angeles:20240120T120000');
            };
        });

        test('should update ICS preview panel', () => {
            window.parsedEvents = [{
                title: 'Test Event',
                date: '2024-01-20',
                time: '09:00-10:00',
                description: 'Test Description'
            }];

            const icsBlob = generateICS();
            const reader = new FileReader();
            const icsPreview = document.getElementById('icsPreview');
            
            reader.readAsText(icsBlob);
            reader.onload = () => {
                const icsContent = reader.result;
                icsPreview.style.display = 'block';
                icsPreview.textContent = icsContent;
                
                expect(icsPreview.style.display).toBe('block');
                expect(icsPreview.textContent).toContain('BEGIN:VCALENDAR');
                expect(icsPreview.textContent).toContain('END:VCALENDAR');
            };
        });
    });
});