FROM node:20.14.0-bookworm

RUN mkdir -p /api

COPY package.json /api

COPY /src/ /api/src

COPY .eslintrc.js /api/eslintrc.js

COPY tsconfig.json /api/tsconfig.json

WORKDIR /api

RUN npm install \
  && npm rebuild bcrypt --build-from-source

EXPOSE 8000

CMD ["npm", "run", "start:dev"]
