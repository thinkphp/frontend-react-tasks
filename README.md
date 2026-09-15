# To-Do List — React + FastAPI + PostgreSQL

Aplicație full-stack de gestionare a task-urilor zilnice: frontend React (Vite), backend FastAPI, bază de date PostgreSQL. Deploy live pe Vercel (frontend) și Render (backend + bază de date).

## Arhitectură

```
┌─────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│   React (Vite)   │  HTTP   │   FastAPI          │  SQL    │   PostgreSQL       │
│   frontend        │ ──────▶│   backend           │ ──────▶│   (Render)         │
│   (Vercel)         │        │   (Render)           │        │                    │
└─────────────────┘         └──────────────────┘         └──────────────────┘
```

- **Frontend**: React, componente `App.jsx` (state + fetch-uri) și `TaskItem.jsx` (afișare/editare per task)
- **Backend**: FastAPI, cu SQLAlchemy async (`asyncpg`) pentru conexiunea la Postgres
- **Bază de date**: PostgreSQL, un singur model `Task` (id, text, done, created_at)

## Structura proiectului

```
.
├── Backend/
│   ├── main.py            # rutele FastAPI (/api/tasks, /api/tasks/{id})
│   ├── models.py          # modelul SQLAlchemy Task
│   ├── schemas.py         # validare Pydantic (request/response)
│   ├── database.py        # conexiune async catre Postgres
│   ├── requirements.txt
│   ├── runtime.txt        # versiune Python (daca e nevoie)
│   ├── docker-compose.yml # Postgres local, pentru dev
│   ├── .gitignore
│   └── .env               # DATABASE_URL (NU se urca pe Git)
│
└── frontend/ (radacina React)
    ├── src/
    │   ├── App.jsx         # componenta principala, state + fetch-uri
    │   ├── TaskItem.jsx     # un task individual, cu edit/delete
    │   └── index.css
    ├── vite.config.js       # proxy /api -> localhost:8000, pentru dev
    ├── .env                 # VITE_API_URL gol local (foloseste proxy-ul)
    └── .env.production       # VITE_API_URL = URL-ul backend-ului de pe Render
```

## Rute API

| Metodă | Rută              | Descriere                     |
|--------|--------------------|--------------------------------|
| GET    | `/api/tasks`       | Lista tuturor task-urilor      |
| POST   | `/api/tasks`       | Creează un task nou            |
| PUT    | `/api/tasks/{id}`  | Actualizează textul unui task  |
| DELETE | `/api/tasks/{id}`  | Șterge un task                 |

Documentație interactivă (Swagger): `<backend-url>/docs`

## Rulare locală

### 1. Backend

```bash
cd Backend

# Porneste Postgres (Docker, recomandat)
sudo docker compose up -d

# Sau, daca ai Postgres instalat nativ, sari peste docker compose
# si ajustezi DATABASE_URL din .env cu user/parola/port-ul tale.

# Mediu virtual + dependente
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configurare
cp .env.example .env   # daca exista; altfel creezi manual .env
# .env trebuie sa contina:
# DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/todo_db

# Pornire
uvicorn main:app --reload --port 8000
```

Verifici la `http://localhost:8000/docs`.

### 2. Frontend

```bash
cd frontend   # radacina proiectului React
npm install

# .env local (poate ramane gol - foloseste proxy-ul din vite.config.js)
echo "VITE_API_URL=" > .env

npm run dev
```

Deschizi `http://localhost:5173`. Cererile către `/api/*` sunt redirecționate automat către `localhost:8000` prin proxy-ul din `vite.config.js`.

## Deploy în producție

### Backend — Render

1. **PostgreSQL**: "New +" → "PostgreSQL" (plan Free). Copiezi **Internal Database URL**.
2. **Web Service**: "New +" → "Web Service", conectat la acest repo, cu:
   - Root Directory: `Backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
3. **Environment Variables** pe Web Service:
   - `DATABASE_URL` = Internal Database URL de la pasul 1

Notă: free tier PostgreSQL pe Render expiră după 30 de zile fără upgrade; Web Service-ul free adoarme după 15 minute de inactivitate (cold start 30-60s la următorul request).

### Frontend — Vercel

1. Conectezi repo-ul pe Vercel, **Framework Preset: Vite**
2. **Settings → Environment Variables**:
   - `VITE_API_URL` = URL-ul complet al Web Service-ului de pe Render (fără `/` la final), bifat pentru **Production**
3. Build Command: `npm run build`, Output Directory: `dist`
4. Orice `git push` declanșează automat un deploy nou

## Probleme întâlnite și rezolvate

- **`pydantic-core` nu se compilează** pe Render (Python 3.14 fără wheel precompilat) → rezolvat prin upgrade la `pydantic>=2.12.2`
- **`greenlet` lipsă / fără wheel pentru 3.14** → rezolvat cu `greenlet>=3.2.4`
- **`.env` neîncărcat** → lipsea `load_dotenv()` în `database.py`
- **CORS / 404 pe Vercel** → `fetch()`-urile din `App.jsx` trebuie să folosească `VITE_API_URL` (variabilă de mediu), nu căi relative, în producție

## Securitate

- `.env` (Backend) și `.env.production` (frontend, dacă e cazul) **nu** conțin secrete grave (URL-uri de bază de date cu parole generate de Render) — totuși, `.env` local e în `.gitignore` și nu trebuie urcat cu credențiale proprii, custom.
- CORS pe backend (`main.py`, `allow_origins`) e setat la `["*"]` pentru dezvoltare — restrânge la domeniul real al frontend-ului înainte de a considera proiectul "gata pentru producție".
