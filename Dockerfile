FROM onfinality/subql-node:v1.10.2
COPY . /app/
RUN cd /app && yarn install && yarn codegen && yarn build
CMD ["-f=app", "--db-schema=app"]
