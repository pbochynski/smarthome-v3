FROM mhart/alpine-node:8

WORKDIR /app
COPY . /app

# If you have native dependencies, you'll need extra tools
# RUN apk add --no-cache make gcc g++ python

RUN yarn install --production \
  && cd client \
  && yarn install \
  && yarn build

EXPOSE 5000
CMD ["node", "index.js"]