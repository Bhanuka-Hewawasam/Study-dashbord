# StudyPilot backend deployment

## Render

Create a Render Web Service with `backend` as its root directory:

- Build command: `./build.sh`
- Start command: `gunicorn config.wsgi:application`

Set these environment variables in Render:

- `SECRET_KEY`: a long, random Django secret
- `DEBUG`: `False`
- `ALLOWED_HOSTS`: the Render hostname, comma-separated if there is more than one
- `DATABASE_URL`: the Neon PostgreSQL connection URL
- `CORS_ALLOWED_ORIGINS`: the deployed frontend origin(s), comma-separated
- `CSRF_TRUSTED_ORIGINS`: the trusted HTTPS origin(s), comma-separated

The build command installs dependencies, collects static files, and applies schema
migrations. It does not load sample sessions or run the manual `seed_flights`
command, so a new production database starts without study-session records.

## Test locally with Neon

Use a Neon development branch rather than the production database. Copy
`.env.example` to `.env`, fill in the variables above, and set `DATABASE_URL` to
that branch's connection URL. Then run from this directory:

```powershell
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Check `http://127.0.0.1:8000/api/health/` for `{"status":"ok"}`. If
`DATABASE_URL` is unset, the backend uses the local `db.sqlite3` database.
