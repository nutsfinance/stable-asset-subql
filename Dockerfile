FROM onfinality/subql-node:v1.16.0
ARG NETWORK
COPY . /app/
RUN mv /app/${NETWORK}-project.yaml /app/project.yaml
RUN cd /app && yarn install && yarn codegen && yarn build
CMD ["-f=app", "--db-schema=app"]
