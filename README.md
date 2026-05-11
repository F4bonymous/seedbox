# seedbox

## Debian 12

### Swizzin
```bash
bash <(curl -sL s5n.sh) && . ~/.bashrc
```
- panel
- rtorrent (REPO)
- Flood
- NGINX
- Let's Encrypt
- Filebrowser

### Config NGINX
- add to /etc/nginx/nginx.conf
```
http {

# set client body size
client_max_body_size 5M;
```
