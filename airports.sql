CREATE DATABASE AIRPORTS;

DROP TABLE IF EXISTS AIRPORTS;

CREATE TABLE AIRPORTS (
  iata varchar(3) primary key,
  city text not null,
  lat numeric not null,
  lon numeric not null,
  state text not null,
  active boolean default true
);