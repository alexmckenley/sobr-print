#! /bin/bash

git pull origin master

cat sobr-print-server.service | sudo tee /etc/systemd/system/sobr-print-server.service

sudo systemctl daemon-reload
sudo systemctl restart sobr-print-server.service
sudo systemctl status sobr-print-server.service
