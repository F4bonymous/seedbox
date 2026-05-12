# seedbox

## Debian 12

### Swizzin
```bash
bash <(curl -sL s5n.sh) && . ~/.bashrc
```
- nginx
- rtorrent (REPO)
- panel
- flood
- filebrowser
- letsencrypt

### Config NGINX
- add to /etc/nginx/nginx.conf
```
http {

# set client body size
client_max_body_size 5M;
```
