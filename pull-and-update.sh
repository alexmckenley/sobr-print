#! /bin/bash

git pull origin master

cat sobr-print-server.service | sudo tee /lib/systemd/system/sobr-print-server.service

systemctl daemon-reload
sudo systemctl restart sobr-print-server.service
sudo systemctl status sobr-print-server.service
