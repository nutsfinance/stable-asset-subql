FROM onfinality/subql-node:v1.16.0
COPY . /app/
RUN cd /app && yarn install && yarn codegen && yarn build
CMD ["-f=app", "--db-schema=app"]
