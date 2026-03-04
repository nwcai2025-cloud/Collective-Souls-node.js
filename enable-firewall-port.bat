@echo off
echo Enabling firewall port 8080 for mobile testing...
netsh advfirewall firewall add rule name="Node.js 8080" dir=in action=allow protocol=TCP localport=8080
echo Firewall rule added successfully.
echo You can now access https://192.168.4.24:8080 from your phone.
pause