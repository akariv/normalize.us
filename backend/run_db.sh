#!/bin/sh
docker run -v normalize-db:/var/lib/postgresql/data -e POSTGRES_PASSWORD=normalize -e POSTGRES_USER=normalize -d -p 5432:5432 postgres
