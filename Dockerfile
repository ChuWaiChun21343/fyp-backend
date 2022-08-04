FROM node:16.13.1

#tells docker to create this directory and work on it
WORKDIR /code 

# ENV PORT 3000

COPY package.json /code/package.json

RUN npm install

COPY . /code

EXPOSE 8080
CMD ["npm","start"]