#!/bin/bash
# generate a private key
openssl genrsa -out key.pem
# create a certificate signing request
openssl req -new -config cert.cnf -key key.pem -out csr.pem
# create a self-signed certificate
openssl x509 -req -days 9999 -in csr.pem -signkey key.pem -out cert.pem