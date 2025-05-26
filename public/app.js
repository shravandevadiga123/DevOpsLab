if (typeof moment === "undefined") {
    console.error("❌ moment.js is not loaded. Please check your script tag in index.html.");
}


class MeetingRoomBooker {
    constructor() {
        this.currentUser = null;
        this.token = null;
        this.initializeEventListeners();
    }

    initializeEventListeners() { 
        document.getElementById('signup-form').addEventListener('submit', async (e) => { 
            e.preventDefault(); 
            await this.signup(); 
        }); 
    
        document.getElementById('login-form').addEventListener('submit', async (e) => { 
            e.preventDefault(); 
            await this.login(); 
        }); 
    
        document.getElementById('logout-link').addEventListener('click', (e) => { 
            e.preventDefault(); 
            this.logout(); 
        }); 
    
        document.getElementById('show-signup').addEventListener('click', () => this.showPage('signup-page')); 
        document.getElementById('show-login').addEventListener('click', () => this.showPage('login-page')); 
    
        const bookingDate = document.getElementById('booking-date'); 
        const bookingTime = document.getElementById('booking-time'); 
    
        if (bookingDate && bookingTime) { 
            const today = new Date().toISOString().split('T')[0]; 
            bookingDate.setAttribute('min', today); 
            bookingDate.value = today; 
    
            // ✅ Ensure room statuses update when the user selects a date/time
            bookingTime.addEventListener('change', () => this.updateRoomStatuses()); 
            bookingDate.addEventListener('change', () => this.updateRoomStatuses()); 
    
            this.setDefaultTime();
        } 
    
        const rooms = document.querySelectorAll('.room'); 
        rooms.forEach(room => { 
            room.addEventListener('click', async () => { 
                await this.bookRoom(room); 
            }); 
        });
    
        // ✅ Event listener for the "Search" button 
        const searchBtn = document.getElementById('search-btn'); 
        if (searchBtn) { 
            searchBtn.addEventListener('click', () => this.updateRoomStatuses()); 
        } 
    
        // ✅ Event listener for the "Fetch Bookings" button 
        const fetchBookingsBtn = document.getElementById('fetch-bookings-btn'); 
        if (fetchBookingsBtn) { 
            fetchBookingsBtn.addEventListener('click', () => this.fetchBookingsByDate()); 
        } 
    }
    
    
    
    
    

    setDefaultTime() {
        const bookingTime = document.getElementById('booking-time');
        let now = new Date();
        let hours = now.getHours() % 12 || 12;
        let minutes = now.getMinutes();
        let ampm = now.getHours() >= 12 ? 'PM' : 'AM';
        bookingTime.value = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    }

    formatTimeTo24Hour(time) {
        let [hourMinute, ampm] = time.split(' ');
        let [hours, minutes] = hourMinute.split(':').map(Number);
        if (ampm === 'PM' && hours !== 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
        return `${hours.toString().padStart(2, '0')}:${minutes}`;
    }

    showPage(pageId) {
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        document.getElementById(pageId).classList.add('active');

        if (pageId === 'login-page') {
            document.getElementById('login-form').reset();
        } else if (pageId === 'signup-page') {
            document.getElementById('signup-form').reset();
        }
    }

    async signup() {
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;

        const response = await fetch('http://localhost:5000/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            alert('Signup successful! Please log in.');
            this.showPage('login-page');
        } else {
            alert('Signup failed');
        }
    }

    async login() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
    
        try {
            const response = await fetch('http://localhost:5000/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                alert(errorData.error || "Login failed");
                return;
            }
    
            const data = await response.json();
            this.token = data.token;
            this.currentUser = { email };
    
            localStorage.setItem('token', this.token);
            localStorage.setItem('user', JSON.stringify(this.currentUser));
    
            this.showPage('dashboard-page');
    
            // ✅ Ensure token is set before fetching bookings
            setTimeout(() => {
                this.fetchBookingsByDate();
            }, 500); // Small delay to allow token storage
    
            this.updateRoomStatuses();
        } catch (error) {
            console.error('Login error:', error);
            alert('Error logging in');
        }
    }
    

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.showPage('login-page');
    }

    async updateRoomStatuses() {
        const bookingDate = document.getElementById("booking-date").value;
        const bookingTime = document.getElementById("booking-time").value;
        const formattedTime = this.formatTimeTo24Hour(bookingTime);
        const token = localStorage.getItem('token'); // ✅ Ensure latest token
    
        try {
            const response = await fetch(`http://localhost:5000/bookings?date=${bookingDate}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
    
            if (!response.ok) {
                console.error("Failed to fetch room statuses");
                return;
            }
    
            const bookings = await response.json();
            const rooms = document.querySelectorAll(".room");
    
            rooms.forEach(room => {
                const roomId = room.dataset.roomId;
                const statusIndicator = room.querySelector(".room-status-indicator");
    
                if (!statusIndicator) {
                    console.error(`Missing status indicator for room ${roomId}`);
                    return;
                }
    
                const selectedTime = moment(`${bookingDate} ${formattedTime}`, "YYYY-MM-DD HH:mm");
                const selectedEndTime = moment(selectedTime).add(1, "hour");
    
                const isBooked = bookings.some(booking => {
                    const bookingStartTime = moment(`${booking.booking_date} ${booking.booking_time}`, "YYYY-MM-DD HH:mm");
                    const bookingEndTime = moment(bookingStartTime).add(1, "hour");
                    
                    return (
                        booking.room_id == roomId &&
                        (
                            (selectedTime.isSameOrAfter(bookingStartTime) && selectedTime.isBefore(bookingEndTime)) ||
                            (selectedTime.isBefore(bookingStartTime) && selectedEndTime.isAfter(bookingStartTime))
                        )
                    );
                });
    
                // ✅ Update the room color dynamically
                if (isBooked) {
                    room.classList.add("booked");
                    statusIndicator.style.backgroundColor = "red"; // Room is booked
                } else {
                    room.classList.remove("booked");
                    statusIndicator.style.backgroundColor = "green"; // Room is available
                }
            });
    
            console.log("✅ Room statuses updated", bookings);
        } catch (error) {
            console.error("Error fetching room statuses:", error);
        }
    }

    
    

    async bookRoom(roomElement) {
        if (!this.currentUser || !this.token) {
            alert('Please login first!');
            return;
        }
    
        const bookingDate = document.getElementById('booking-date').value;
        const bookingTime = document.getElementById('booking-time').value;
        const formattedTime = this.formatTimeTo24Hour(bookingTime);
        const roomId = roomElement.dataset.roomId;
        const bookingPurpose = document.getElementById('booking-purpose').value;
    
        if (!bookingDate || !bookingTime || !bookingPurpose) {
            alert('Please fill all details');
            return;
        }
    
        try {
            // Fetch current bookings before sending request
            const response = await fetch(`http://localhost:5000/bookings?date=${bookingDate}`, {
                headers: { 'Authorization': `Bearer ${this.token}` },
            });
    
            if (!response.ok) {
                console.error("Failed to fetch bookings");
                return;
            }
    
            const bookings = await response.json();
            const selectedTime = moment(`${bookingDate} ${formattedTime}`, "YYYY-MM-DD HH:mm");
            const selectedEndTime = moment(selectedTime).add(1, "hour");
    
            // Modified to check for actual overlapping time periods
            const isBooked = bookings.some(booking => {
                const bookingStartTime = moment(`${booking.booking_date} ${booking.booking_time}`, "YYYY-MM-DD HH:mm");
                const bookingEndTime = moment(bookingStartTime).add(1, "hour");
                
                // Check for any overlap between the booking intervals
                return (
                    booking.room_id == roomId &&
                    (
                        // Selected time falls within an existing booking
                        (selectedTime.isSameOrAfter(bookingStartTime) && selectedTime.isBefore(bookingEndTime)) ||
                        // Selected booking overlaps with an existing booking
                        (selectedTime.isBefore(bookingStartTime) && selectedEndTime.isAfter(bookingStartTime))
                    )
                );
            });
    
            if (isBooked) {
                alert('This room is already booked at the selected time!');
                return;
            }
    
            // Proceed with booking if room is available
            const bookResponse = await fetch('http://localhost:5000/book-room', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`  
                },
                body: JSON.stringify({
                    user_email: this.currentUser.email,
                    room_id: roomId,
                    booking_date: bookingDate,
                    booking_time: formattedTime,
                    purpose: bookingPurpose
                })
            });
    
            if (!bookResponse.ok) {
                const errorData = await bookResponse.json();
                alert(errorData.error || "Booking failed");
                return;
            }
    
            alert(`Room ${roomId} booked successfully for ${bookingDate} at ${bookingTime}`);
            this.updateRoomStatuses();
        } catch (error) {
            console.error('Booking error:', error);
            alert('Error booking room');
        }
    }

    async fetchBookingsByDate() {
        const bookingDate = document.getElementById("view-booking-date").value;
        const bookingList = document.getElementById("booking-list");
        const token = localStorage.getItem('token'); // ✅ Always fetch latest token
    
        if (!bookingDate) {
            alert("Please select a date!");
            return;
        }
    
        try {
            const response = await fetch(`http://localhost:5000/bookings?date=${bookingDate}`, {
                headers: { Authorization: `Bearer ${token}` }, // ✅ Use latest token
            });
    
            if (!response.ok) {
                console.error("Failed to fetch bookings");
                return;
            }
    
            const bookings = await response.json();
            bookingList.innerHTML = "";  
    
            if (bookings.length === 0) {
                bookingList.innerHTML = "<li>No bookings found for this date.</li>";
                return;
            }
    
            bookings.forEach((booking) => {
                const listItem = document.createElement("li");
                listItem.textContent = `Room ${booking.room_id} - ${booking.booking_time} - ${booking.user_email} - ${booking.purpose}`;
                bookingList.appendChild(listItem);
            });
    
            console.log("✅ Bookings fetched:", bookings);  
        } catch (error) {
            console.error("Error fetching bookings:", error);
        }
    }
    
    
    
}

// ✅ Restore session if user is already logged in
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
        const meetingRoomBooker = new MeetingRoomBooker();
        meetingRoomBooker.token = token;
        meetingRoomBooker.currentUser = JSON.parse(user);

        meetingRoomBooker.showPage('dashboard-page');
        
        // ✅ Update room statuses after login
        setTimeout(() => {
            meetingRoomBooker.updateRoomStatuses();
        }, 500);
    } else {
        //new MeetingRoomBooker();
    }
});


