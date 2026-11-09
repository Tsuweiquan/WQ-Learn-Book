# Create a folder
```
sudo useradd --system --create-home --home-dir /opt/gh-runner --shell /usr/sbin/nologin gh-runner
sudo chmod 700 /opt/gh-runner

sudo -u gh-runner -s /bin/bash
cd /opt/gh-runner

curl -o actions-runner-linux-x64-2.338.2.tar.gz -L https://github.com/actions/runner/releases/download/v2.338.2/actions-runner-linux-x64-2.338.2.tar.gz

echo "baebf204307bac6193480852732f0aba2ae97b6c5597c244f4d5558390147c40  actions-runner-linux-x64-2.338.2.tar.gz" | shasum -a 256 -c

# Extract the installer

tar xzf ./actions-runner-linux-x64-2.338.2.tar.gz

./config.sh --url https://github.com/Tsuweiquan/WQ-Learn-Book --token <REDACTED>

# Test run in a instance.
./run.sh 

# Run as a service
exit
# As my own user
cd /opt/gh-runner
sudo ./svc.sh install gh-runner
sudo ./svc.sh start
systemctl status 'actions.runner.*' --no-pager
```