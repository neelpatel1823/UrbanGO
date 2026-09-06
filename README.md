# UrbanGO
## Install of not


- **Node.js**: `v20.x` or higher 
- **npm**: `v9.x` or higher 
- **PostgreSQL** **OR** **Docker Desktop**

---
#### 1. Project directory
```bash
cd "E:\URbanpulse"
```

#### 2. Install dependencies
```bash
npm install
```

#### 3. Configure environment variables
Create a `.env` file in the root directory (or copy `.env.example`):
```bash
# cd .env.example .env

```

Open `.env` and set your PostgreSQL connection details:
```env
DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/urbanpulse?schema=public"
PORT=3000
```

#### 4. Create the Database & Apply Migrations
Ensure your PostgreSQL server is running:
```bash
npx prisma migrate dev --name init
```
*This will create the database (if it does not exist) and generate the required `User` and `Report` tables.*

#### 5. Seed the Database 
Populate the database with the default System Administrator account:
```bash
npm run prisma:seed
```

#### 6. Start the Application Server
```bash
npm start
```
*Or for development:*
```bash
npm run dev
```

#### 7. Access UrbanPulse
Open your web browser and navigate to:
```
http://localhost:3000
```

---
