const { parseDateTime } = require('../public/js/calendar-utils');

describe('Calendar Download Functionality', () => {
    beforeEach(() => {
        // Mock the DOM elements
        document.body.innerHTML = `
            <textarea id="eventText"></textarea>
            <div id="preview"></div>
            <div id="errorBox" class="error-box"></div>
            <button id="downloadBtn" onclick="generateICS()">Download Calendar File</button>
        `;
        // Reset parsedEvents array
        window.parsedEvents = [];
    });

    describe('Special Time Names', () => {
        test('handles morning time correctly', () => {
            const { start, end } = parseDateTime('2024-01-20', 'morning');
            expect(start.getHours()).toBe(9);
            expect(start.getMinutes()).toBe(0);
            expect(end.getHours()).toBe(12);
            expect(end.getMinutes()).toBe(0);
        });

        test('handles evening time correctly', () => {
            const { start, end } = parseDateTime('2024-01-20', 'evening');
            expect(start.getHours()).toBe(18);
            expect(start.getMinutes()).toBe(0);
            expect(end.getHours()).toBe(22);
            expect(end.getMinutes()).toBe(0);
        });

        test('handles TBD time correctly', () => {
            const { start, end } = parseDateTime('2024-01-20', 'TBD');
            expect(start.getHours()).toBe(9);
            expect(start.getMinutes()).toBe(0);
            expect(end.getHours()).toBe(17);
            expect(end.getMinutes()).toBe(0);
        });

        test('handles all day time correctly', () => {
            const { start, end } = parseDateTime('2024-01-20', 'all day');
            expect(start.getHours()).toBe(9);
            expect(start.getMinutes()).toBe(0);
            expect(end.getHours()).toBe(17);
            expect(end.getMinutes()).toBe(0);
        });
    });

    test('generateICS creates valid ICS file with single event', () => {
        // Mock URL.createObjectURL and document.createElement
        const mockUrl = 'blob:test-url';
        const mockClick = jest.fn();
        window.URL.createObjectURL = jest.fn().mockReturnValue(mockUrl);
        window.URL.revokeObjectURL = jest.fn();

        // Mock a single event
        window.parsedEvents = [{
            title: 'Test Meeting',
            date: '2024-01-20',
            time: '09:00-10:00',
            description: 'Test Description',
            location: 'Test Location'
        }];

        // Create a spy for document.createElement
        document.createElement = jest.fn().mockReturnValue({
            href: '',
            download: '',
            click: mockClick
        });

        // Call generateICS
        generateICS();

        // Verify Blob creation
        expect(window.URL.createObjectURL).toHaveBeenCalled();
        const blobCall = window.URL.createObjectURL.mock.calls[0][0];
        expect(blobCall).toBeInstanceOf(Blob);

        // Convert Blob to text and verify content
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
                const icsContent = reader.result;
                expect(icsContent).toContain('BEGIN:VCALENDAR');
                expect(icsContent).toContain('VERSION:2.0');
                expect(icsContent).toContain('BEGIN:VEVENT');
                expect(icsContent).toContain('SUMMARY:Test Meeting');
                expect(icsContent).toContain('DESCRIPTION:Test Description');
                expect(icsContent).toContain('LOCATION:Test Location');
                expect(icsContent).toContain('END:VEVENT');
                expect(icsContent).toContain('END:VCALENDAR');
                resolve();
            };
            reader.readAsText(blobCall);
        });
    });

    test('generateICS creates valid ICS file with multiple events', () => {
        // Mock URL.createObjectURL and document.createElement
        const mockUrl = 'blob:test-url';
        const mockClick = jest.fn();
        window.URL.createObjectURL = jest.fn().mockReturnValue(mockUrl);
        window.URL.revokeObjectURL = jest.fn();

        // Mock multiple events
        window.parsedEvents = [
            {
                title: 'Morning Meeting',
                date: '2024-01-20',
                time: '09:00-10:00',
                description: 'First Meeting',
                location: 'Room A'
            },
            {
                title: 'Evening Meeting',
                date: '2024-01-20',
                time: '14:00-15:00',
                description: 'Second Meeting',
                location: 'Room B'
            }
        ];

        // Create a spy for document.createElement
        document.createElement = jest.fn().mockReturnValue({
            href: '',
            download: '',
            click: mockClick
        });

        // Call generateICS
        generateICS();

        // Verify Blob creation
        expect(window.URL.createObjectURL).toHaveBeenCalled();
        const blobCall = window.URL.createObjectURL.mock.calls[0][0];
        expect(blobCall).toBeInstanceOf(Blob);

        // Convert Blob to text and verify content
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
                const icsContent = reader.result;
                expect(icsContent).toContain('BEGIN:VCALENDAR');
                expect(icsContent).toContain('VERSION:2.0');
                expect(icsContent).toMatch(/BEGIN:VEVENT.*BEGIN:VEVENT/s);
                expect(icsContent).toContain('SUMMARY:Morning Meeting');
                expect(icsContent).toContain('SUMMARY:Evening Meeting');
                expect(icsContent).toContain('DESCRIPTION:First Meeting');
                expect(icsContent).toContain('DESCRIPTION:Second Meeting');
                expect(icsContent).toContain('LOCATION:Room A');
                expect(icsContent).toContain('LOCATION:Room B');
                expect(icsContent).toMatch(/END:VEVENT.*END:VEVENT/s);
                expect(icsContent).toContain('END:VCALENDAR');
                resolve();
            };
            reader.readAsText(blobCall);
        });
    });

    test('generateICS handles events with missing optional fields', () => {
        // Mock URL.createObjectURL and document.createElement
        const mockUrl = 'blob:test-url';
        const mockClick = jest.fn();
        window.URL.createObjectURL = jest.fn().mockReturnValue(mockUrl);
        window.URL.revokeObjectURL = jest.fn();

        // Mock event with missing optional fields
        window.parsedEvents = [{
            title: 'Simple Meeting',
            date: '2024-01-20',
            time: '09:00-10:00'
        }];

        // Create a spy for document.createElement
        document.createElement = jest.fn().mockReturnValue({
            href: '',
            download: '',
            click: mockClick
        });

        // Call generateICS
        generateICS();

        // Verify Blob creation
        expect(window.URL.createObjectURL).toHaveBeenCalled();
        const blobCall = window.URL.createObjectURL.mock.calls[0][0];
        expect(blobCall).toBeInstanceOf(Blob);

        // Convert Blob to text and verify content
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
                const icsContent = reader.result;
                expect(icsContent).toContain('BEGIN:VCALENDAR');
                expect(icsContent).toContain('VERSION:2.0');
                expect(icsContent).toContain('BEGIN:VEVENT');
                expect(icsContent).toContain('SUMMARY:Simple Meeting');
                expect(icsContent).not.toContain('DESCRIPTION:');
                expect(icsContent).not.toContain('LOCATION:');
                expect(icsContent).toContain('END:VEVENT');
                expect(icsContent).toContain('END:VCALENDAR');
                resolve();
            };
            reader.readAsText(blobCall);
        });
    });
}));