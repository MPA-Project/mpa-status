FROM node:14-alpine

WORKDIR /src

ADD package.json /src 

RUN yarn install

ADD . /src 

# RUN npm run build 

CMD yarn dev