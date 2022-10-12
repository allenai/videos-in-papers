# Papeo 📄📹

The user interface and API for a PDF reader augmented with clips from talk videos.

## Local Environment

Your application uses a local database. To set the credentials, set `$POSTGRES_USER` and `$POSTGRES_PASSWORD` with your chosen user and password in `docker-compose.yaml`:

```yaml
version: '3'
services:
    sonar:
        ...
    api:
        build: ./api
        volumes:
            ...
        environment:
            ...
            - POSTGRES_URL=postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@db:5432/paper-video-nav?sslmode=disable
            ...
    ui:
        ...
    proxy:
        ...
    it:
        ...
    db:
        image: postgres:14
        restart: always
        ports: ['5432:5432']
        environment:
            POSTGRES_USER: $POSTGRES_USER
            POSTGRES_PASSWORD: $POSTGRES_PASSWORD
            POSTGRES_DB: paper-video-nav
        volumes:
            - pgdata:/var/lib/postgresql/data
```

Then, you can start a local environment like so:

```docker compose up --build```