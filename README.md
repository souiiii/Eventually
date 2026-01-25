
# Eventually

**Eventually** is a web-based event management system designed to streamline the process of organizing, managing, and attending events. It features role-based access control for Administrators and Students, allowing for secure event creation, registration, and attendance tracking.


# Project Showcase

<img width="929" height="930" alt="image" src="https://github.com/user-attachments/assets/98f063e8-ac92-468b-81a3-0c211b51c108" />
<img width="687" height="856" alt="image" src="https://github.com/user-attachments/assets/841cc7af-e0b4-4482-b7d7-f97a85edeea9" />
<img width="853" height="741" alt="image" src="https://github.com/user-attachments/assets/da92a235-4e6c-429f-b725-125d4c53b2d8" />


## 🚀 Features

### For Administrators

* **Event Management**: Create, edit, and delete events with details like title, description, venue, capacity, and deadlines.
* **Attendance Tracking**: Manage student attendance for specific events (via unique codes).
* **Dashboard**: View and manage all events and their statuses.

### For Students

* **User Authentication**: Secure login and signup functionality.
* **Event Discovery**: Browse upcoming and past events.
* **Registration**: Register for events with a single click (subject to capacity and deadlines).
* **Dashboard**: View personal registration status (Registered/Cancelled) and attendance history.
* **Ticket Generation**: Receive unique registration codes for event entry.

## 🛠️ Tech Stack

* **Backend**: Node.js, Express.js
* **Database**: MongoDB (via Mongoose)
* **Templating Engine**: EJS (Embedded JavaScript)
* **Styling**: Custom CSS (Poppins & JetBrains Mono fonts)
* **Authentication**: Cookie-based session management

## 📂 Project Structure

```text
├── models/             # Mongoose schemas (Event, User, Registration)
├── views/              # EJS templates for UI rendering
│   ├── admin/          # Admin-specific pages (Add/Edit Event)
│   ├── common/         # Shared pages (Home, Error)
│   ├── dashboard/      # User dashboard (Registered/Cancelled events)
│   ├── events/         # Event listing and details pages
│   └── user/           # Auth pages (Login, Signup)
├── routes/             # Express route handlers
│   ├── admin.js        # Admin routes
│   ├── events.js       # Event-related routes
│   └── user.js         # Authentication routes
├── middlewares/        # Custom middlewares (Auth, Role verification)
├── public/             # Static assets (CSS, Images)
├── app.js              # Application entry point
└── connection.js       # Database connection logic

```

## ⚙️ Installation & Setup

1. **Clone the repository**
```bash
git clone https://github.com/souiiii/Eventually.git
cd Eventually

```


2. **Install dependencies**
```bash
npm install

```


3. **Environment Configuration**
Ensure you have a MongoDB instance running. You may need to configure the connection string in `app.js` or via an environment variable (e.g., `MONGO_URL`).
*Note: The code uses a variable `mongoPath` in `app.js` for the connection.*
4. **Run the application**
```bash
npm start

```


The server typically starts on port `8000` (or as defined in `PORT`).
5. **Access the App**
Open your browser and navigate to:
`http://localhost:8000`

## 🛡️ Usage Roles

* **Student**: Default role upon signup. Can view and register for events.
* **Admin**: Elevated privileges to create and manage events.
* *Note: Role assignment (Admin vs Student) is handled in the `User` model. You may need to manually set a user's role to `ADMIN` in the database to access admin features.*



## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the **ISC License**.
