# OTPAS-HU - Online Tutorial & Project Advising System
**Haramaya University Academic Management System**

## Quick Start

### Prerequisites
- Node.js (v16+)
- PostgreSQL (v12+)
- npm or yarn

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ..
   npm install
   ```

3. Setup database:
   ```bash
   # Create database 'academic_compass'
   # Update backend/.env with your database credentials
   cd backend
   npm run migrate
   ```

4. Start the application:
   ```bash
   # Backend (port 5001)
   cd backend
   npm run dev
   
   # Frontend (port 8080)
   npm run dev
   ```

## System Overview

### Core Features
- **Multi-role Authentication**: Students, Instructors, Department Heads, Admins
- **Tutorial Management**: Video tutorials with file attachments
- **Academic Projects**: Project submission and evaluation system
- **Course Management**: Course enrollment and materials
- **Evaluation System**: Comprehensive grading and feedback
- **Notification System**: Real-time updates and announcements

### Technology Stack
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + PostgreSQL
- **Authentication**: JWT tokens
- **File Storage**: Local filesystem with database metadata

## Project Structure
```
OTPAS-HU/
├── src/                    # Frontend React application
├── backend/                # Node.js backend API
├── docs/                   # Additional documentation
└── README.md              # This file
```

## User Roles
- **Students**: Access tutorials, submit projects, view evaluations
- **Instructors**: Create tutorials, evaluate projects, manage courses
- **Department Heads**: Monitor department activities, manage instructors
- **Admins**: System administration and user management

## Development Status
✅ Authentication & Authorization  
✅ Tutorial System with Video Support  
✅ Project Management  
✅ Evaluation System  
✅ File Upload & Management  
✅ Notification System  
✅ Multi-role Dashboard  

## Support
For technical issues or questions, refer to the documentation in the `docs/` folder or contact the development team.