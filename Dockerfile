FROM node:18

WORKDIR /app

COPY package.json ./

# install dependencies
RUN npm install --production && npm rebuild bcrypt --build-from-source && npm cache clean --force 

COPY . .

# remove dev dependencies
RUN npm prune --production
RUN nohup redis-server &

EXPOSE 8080

CMD ["npm", "run", "prod"]