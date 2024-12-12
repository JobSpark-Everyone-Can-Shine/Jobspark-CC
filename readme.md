<h1 align="center">✨ JobSpark ✨<br> Everyone can shine</h1>

<div align='center'>

![Cloud Computing](https://img.shields.io/badge/Cloud_Computing-%237F52FF?style=for-the-badge&logo=googlecloudstorage&logoColor=white) ![Visual Studio Code](https://img.shields.io/badge/Visual_Studio_Code-2196F3.svg?style=for-the-badge&logo=accenture&logoColor=white) ![Javascript](https://img.shields.io/badge/Javascript-E58800.svg?style=for-the-badge&logo=javascript&logoColor=white)

   <img src='https://storage.googleapis.com/jobspark_public/preview2.jpg' style='width : 70%' />
</div>

## About

JobSpark is a platform designed to empower individuals with Down syndrome by connecting them with employment opportunities. To support the scalability, security and reliability of the platform, we implement Cloud Computing on the JobSpark application. Jobspark-Api-CC is an Backend Service for Jobspark,using Express JS and postgreSQL for database..

## 🏆 Cloud Computing Members


| No  | Name                          | Bangkit ID   | Learning Path    | University                          | Contacts                      |
| --- | ----------------------------- | ------------ | ---------------- | ----------------------------------- | ------------------------------|
| 1   | Rangga Arsy Prawira           | C193B4KY3686 | Machine Learning | Universitas Bina Satana Informatika | https://github.com/arsyrangga |
| 2   | Dhiya Bunga Syafina Ramadhani | C297B4KX1102 | Machine Learning | UPN "Veteran" Yogyakarta            | https://github.com/dhiyabunga |


## 🔧 Technology and Tools

1. API and Backend Technology
   - _Backend and API end points_: REST API
   - _Framework_: Express.js
   - _Constructor_: Node.js
   - _Authentication and Permission_: JSON Web Tokens (JWT)
   - _User Credentials_: bcrypt module
2. Modules and Dependencies:
   - _@google-cloud/storage_: ^7.14.0
   - _axios_: ^1.7.8
   - _bcrypt_: ^5.1.1
   - _body-parser_: ^1.20.3
   - _cors_: ^2.8.5
   - _dotenv_: ^16.4.5
   - _express_: ^4.21.1
   - _express-fileupload_: ^1.5.1
   - _express-handlebars_: ^8.0.1
   - _express-status-monitor_: ^1.3.4
   - _express-validator_: ^7.2.0
   - _fs_: ^0.0.1-security
   - _hashids_: ^2.3.0
   - _helmet_: ^8.0.0
   - _jsonminify_: ^0.4.2
   - _jsonwebtoken_: ^9.0.2
   - _lodash_: ^4.17.21
   - _moment_: ^2.30.1
   - _mongoose_: ^8.8.0
   - _multer_: 1.4.5-lts.1
   - _path_: ^0.12.7
   - _pg_: ^8.13.1
   - _request_: ^2.88.2
   - _sanitizer_: ^0.1.3
   - _sqlstring_: ^2.3.3
   - _strip-ansi_: ^7.1.0
   - _uuid_: ^11.0.2
   - _uuidv4_: ^6.2.13
3. Database
   - _Google Cloud SQL_
   - _Postgre SQL_
4. Google Cloud Platform (GCP)
   - _Cloud SQL to manage our Database_
   - _Cloud Storage to store the data’s_
   - _Artifact Registry to store and manage repository_
   - _Cloud Run to deploy the registry._

# Getting Started

## Prerequisites
- Node.js (version 18.x or higher)
- npm (comes with Node.js)
- Git (for cloning the repository)

## Steps to Run

1. Clone the project repository:
```bash
git clone https://github.com/JobSpark-Everyone-Can-Shine/Jobspark-CC.git jobspark-api
cd jobspark-api
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
- Place your service-account-key.json file in the root directory
- Look for a `.env.example` file in the project root
- Create a new `.env` file based on `.env.example`
```bash
cp .env.example .env
```
- Update the `.env` file with your local configuration values

4. Start the server:
- For development (if using nodemon):
```bash
npm run dev
```
- For production:
```bash
npm start
```

## Common Issues and Solutions

1. Port already in use:
```bash
lsof -i :[port-number]  
kill -9 [PID]         
```

2. Missing dependencies:
```bash
npm install           
npm ci               
```

3. Database connection issues:
- Check if your database server is running
- Verify database credentials in `.env` file
- Ensure database exists and is accessible


For project-specific instructions, check the project's README.md file.
- Node.js (version 18.x or higher)
- npm (usually comes with Node.js)
- Basic knowledge of JavaScript and HTTP concepts
