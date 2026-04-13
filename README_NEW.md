# Apartment Management System

A comprehensive, modern web-based apartment management system built with React, Node.js, and AI-powered features for efficient residential complex management.

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Installation](#installation)
- [Configuration](#configuration)
- [User Roles](#user-roles)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [AI Features](#ai-features)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### Core Management
- **User Management**: Role-based access control for residents, security, admin, and superadmin
- **Rent Management**: Automated rent collection, fine calculation, and payment tracking
- **Bill Management**: Utility bill generation, distribution, and payment processing
- **Visitor Management**: Secure visitor access control with time-based codes
- **Complaint System**: AI-powered sentiment analysis and automated triage

### Advanced Features
- **AI Sentiment Analysis**: Automatic sentiment detection for complaints and feedback
- **Automated Fine Calculator**: Smart late payment penalty calculation
- **Financial Reporting**: Comprehensive analytics and reporting dashboards
- **Real-time Notifications**: Instant alerts for important events
- **Mobile Responsive**: Fully responsive design for all devices

### Security Features
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Granular permissions by user role
- **Data Encryption**: Sensitive data protection
- **Audit Logging**: Complete activity tracking
- **Session Management**: Secure session handling

---

## Technology Stack

### Frontend
- **React 18**: Modern UI framework with hooks
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Modern icon library
- **Recharts**: Data visualization library
- **Axios**: HTTP client for API requests

### Backend
- **Node.js**: JavaScript runtime environment
- **Express.js**: Web application framework
- **PostgreSQL**: Primary database
- **JWT**: Authentication tokens
- **Multer**: File upload handling

### AI & Analytics
- **Natural Language Processing**: Sentiment analysis
- **Machine Learning**: Predictive analytics
- **Data Mining**: Pattern recognition
- **Statistical Analysis**: Financial modeling

---

## Installation

### Prerequisites
- Node.js 16.0 or higher
- PostgreSQL 12.0 or higher
- npm or yarn package manager

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/apartment-management.git
   cd apartment-management
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up database**
   ```bash
   # Create PostgreSQL database
   createdb apartment_management
   
   # Run migrations
   npm run migrate
   
   # Seed database (optional)
   npm run seed
   ```

5. **Start backend server**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start development server**
   ```bash
   npm start
   ```

3. **Build for production**
   ```bash
   npm run build
   ```

---

## Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=apartment_management
DB_USER=your_username
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=8000
NODE_ENV=development

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_email_password

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880  # 5MB

# AI Configuration
AI_MODEL_PATH=./models/sentiment_model
AI_API_KEY=your_ai_api_key
```

### Database Configuration

The system uses PostgreSQL with the following main tables:

- **users**: User authentication and profile data
- **rents**: Rent payment records and schedules
- **bills**: Utility bill information
- **visitors**: Visitor access records
- **complaints**: Complaint tracking and resolution
- **community_posts**: Social interaction data

---

## User Roles

### Resident
- View and manage personal information
- Pay rent and bills online
- Register visitors
- File complaints
- Access community features
- View payment history

### Security
- Manage visitor access and validation
- Monitor building security
- View visitor logs
- Report security incidents
- Access resident directory

### Admin
- Manage all users and permissions
- Access financial reports
- Handle complaints and maintenance
- Generate bills and invoices
- View system analytics

### Superadmin
- Full system administration
- Manage multiple properties
- Configure system settings
- Access all data and reports
- Manage AI model training

---

## Project Structure

```
apartment-management/
|-- backend/
|   |-- src/
|   |   |-- controllers/     # API controllers
|   |   |-- models/         # Database models
|   |   |-- routes/         # API routes
|   |   |-- middleware/     # Custom middleware
|   |   |-- utils/          # Utility functions
|   |   |-- config/         # Configuration files
|   |   |-- ai/             # AI model implementations
|   |   `-- app.js          # Application entry point
|   |-- migrations/         # Database migrations
|   |-- seeds/              # Database seeds
|   `-- tests/              # Test files
|-- frontend/
|   |-- public/             # Static assets
|   |-- src/
|   |   |-- components/     # React components
|   |   |-- pages/          # Page components
|   |   |-- hooks/          # Custom React hooks
|   |   |-- store/          # State management (Zustand)
|   |   |-- utils/          # Utility functions
|   |   |-- styles/         # CSS and styling
|   |   `-- services/       # API service functions
|   `-- package.json
|-- docs/                   # Documentation
|-- README.md
|-- ALGOANDAI.md           # AI and Algorithms documentation
`-- docker-compose.yml      # Docker configuration
```

---

## API Documentation

### Authentication Endpoints

#### POST /api/v1/auth/login
Login user and return JWT token.

**Request Body:**
```json
{
  "username": "resident123",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "resident123",
    "role": "resident",
    "email": "resident@example.com"
  }
}
```

#### POST /api/v1/auth/logout
Logout user and invalidate token.

### User Management Endpoints

#### GET /api/v1/users
Get all users (admin/superadmin only).

#### POST /api/v1/users
Create new user (admin/superadmin only).

#### PUT /api/v1/users/:id
Update user information.

#### DELETE /api/v1/users/:id
Delete user (admin/superadmin only).

### Rent Management Endpoints

#### GET /api/v1/rents
Get rent payment records.

#### POST /api/v1/rents/pay
Process rent payment.

#### GET /api/v1/rents/fines
Calculate and get rent fines.

### Bill Management Endpoints

#### GET /api/v1/bills
Get utility bills.

#### POST /api/v1/bills
Generate new bills.

#### PUT /api/v1/bills/:id/pay
Mark bill as paid.

### Visitor Management Endpoints

#### GET /api/v1/visitors
Get visitor records.

#### POST /api/v1/visitors/register
Register new visitor.

#### PUT /api/v1/visitors/:id/checkin
Check in visitor.

#### PUT /api/v1/visitors/:id/checkout
Check out visitor.

### Complaint Management Endpoints

#### GET /api/v1/complaints
Get complaint records.

#### POST /api/v1/complaints
File new complaint.

#### PUT /api/v1/complaints/:id/resolve
Resolve complaint.

### AI Endpoints

#### POST /api/v1/ai/sentiment
Analyze sentiment of text.

**Request Body:**
```json
{
  "text": "The water pressure is very low in my apartment",
  "context": {
    "user_role": "resident",
    "category": "complaint"
  }
}
```

**Response:**
```json
{
  "sentiment": {
    "positive": 0.1,
    "negative": 0.8,
    "neutral": 0.1
  },
  "urgency": 0.7,
  "classification": "urgent_negative",
  "suggested_action": "immediate_attention"
}
```

---

## AI Features

### Sentiment Analysis

The system uses advanced Natural Language Processing to analyze:

- **Complaints**: Automatically detect urgency and sentiment
- **Feedback**: Analyze resident satisfaction
- **Community Posts**: Moderate content and detect conflicts

#### How It Works

1. **Text Preprocessing**: Clean and normalize input text
2. **Feature Extraction**: Extract linguistic features and patterns
3. **Model Prediction**: Use trained ML model for classification
4. **Context Adjustment**: Adjust scores based on user context
5. **Result Processing**: Generate actionable insights

#### Use Cases

- **Triage System**: Prioritize urgent complaints
- **Quality Control**: Monitor service quality
- **Trend Analysis**: Track satisfaction over time

### Automated Fine Calculator

Intelligent late payment penalty calculation with:

- **Grace Periods**: Configurable grace periods
- **Progressive Rates**: Tiered fine structures
- **Maximum Caps**: Prevent excessive penalties
- **Holiday Considerations**: Weekend and holiday adjustments

### Predictive Analytics

- **Rent Collection**: Predict payment defaults
- **Maintenance**: Anticipate maintenance needs
- **Occupancy**: Forecast occupancy rates

---

## Development Guidelines

### Code Style

- Use ES6+ features and modern JavaScript
- Follow React best practices and hooks
- Implement proper error handling
- Write comprehensive tests
- Use semantic HTML and accessibility features

### Git Workflow

1. Create feature branch from main
2. Implement changes with tests
3. Submit pull request for review
4. Merge after approval

### Testing

```bash
# Run frontend tests
cd frontend
npm test

# Run backend tests
cd backend
npm test

# Run integration tests
npm run test:integration

# Run coverage report
npm run test:coverage
```

---

## Deployment

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Deployment

1. **Environment Setup**
   - Configure production environment variables
   - Set up SSL certificates
   - Configure reverse proxy

2. **Database Setup**
   - Create production database
   - Run migrations
   - Set up backups

3. **Application Deployment**
   - Build frontend assets
   - Deploy backend application
   - Configure monitoring

---

## Monitoring and Analytics

### System Metrics
- Application performance monitoring
- Database query optimization
- User activity tracking
- Error rate monitoring

### Business Analytics
- Rent collection rates
- Occupancy statistics
- Maintenance response times
- Resident satisfaction scores

---

## Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request
5. Wait for review and approval

### Contribution Areas

- **Bug Fixes**: Report and fix issues
- **Features**: Add new functionality
- **Documentation**: Improve documentation
- **Testing**: Improve test coverage
- **AI Models**: Enhance AI capabilities

---

## Support

### Documentation
- [API Documentation](./docs/api.md)
- [AI Algorithms](./ALGOANDAI.md)
- [Database Schema](./docs/database.md)

### Community
- GitHub Issues: Report bugs and request features
- Discussion Forum: Community support and discussions
- Wiki: Additional documentation and guides

### Contact
- Email: support@apartment-management.com
- Phone: +1-234-567-8900
- Address: 123 Management St, Suite 100, City, State 12345

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### License Summary

- **Commercial Use**: Allowed
- **Modification**: Allowed
- **Distribution**: Allowed
- **Private Use**: Allowed
- **Liability**: No warranty provided

---

## Acknowledgments

- **React Team**: For the excellent UI framework
- **PostgreSQL**: For the robust database system
- **OpenAI**: For AI model inspiration
- **Contributors**: All developers who contributed to this project

---

## Version History

### Version 2.0.0 (Current)
- Added AI sentiment analysis
- Implemented automated fine calculation
- Enhanced user interface
- Added mobile responsiveness
- Improved security features

### Version 1.0.0
- Initial release
- Basic user management
- Rent and bill management
- Visitor management
- Complaint system

---

## Roadmap

### Upcoming Features (Version 2.1.0)
- [ ] Mobile app development
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Integration with payment gateways
- [ ] IoT device integration

### Future Enhancements (Version 3.0.0)
- [ ] Blockchain-based payments
- [ ] Advanced AI predictions
- [ ] Smart home integration
- [ ] Energy management system
- [ ] Community marketplace

---

**Thank you for using the Apartment Management System!** 

For questions, support, or contributions, please don't hesitate to reach out to our development team.
