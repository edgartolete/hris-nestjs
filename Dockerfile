FROM node:20.14.0-bookworm

COPY . /api

WORKDIR /api

RUN npm install \
  && npm rebuild bcrypt --build-from-source

EXPOSE 8000

CMD ["npm", "run", "start:dev"]
