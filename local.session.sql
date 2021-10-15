create database normalize;

create table faces (
    id serial primary key,
    votes integer DEFAULT 0,
    tournaments integer DEFAULT 0,
    created_timestamp timestamp default current_timestamp,
    image bytea,
    descriptor jsonb,
    version SMALLINT DEFAULT 0
);

drop TABLE faces;

insert into faces (image) VALUES ('\xaabbcc');

select count(1) from faces;

select id, descriptor from faces;

delete from faces where id in ()