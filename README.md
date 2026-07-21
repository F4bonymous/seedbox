# seedbox

## Debian 12
```bash
vim vim /etc/apt/sources.list.d/debian.sources
```
```
Types: deb deb-src
URIs: mirror+file:///etc/apt/mirrors/debian.list
Suites: bookworm bookworm-updates bookworm-backports
Components: main contrib non-free-firmware non-free
Signed-By: /usr/share/keyrings/debian-archive-keyring.gpg

Types: deb deb-src
URIs: mirror+file:///etc/apt/mirrors/debian-security.list
Suites: bookworm-security
Components: main contrib non-free-firmware non-free
Signed-By: /usr/share/keyrings/debian-archive-keyring.gpg
```
### Swizzin
```bash
bash <(curl -sL s5n.sh) && . ~/.bashrc
```
- nginx
- rtorrent (REPO)
- panel
- flood (socket : /var/run/{USER}/.rtorrent.sock)
- filebrowser
- letsencrypt
- jellyfin


### Generate thumb with python
- python-pillow
- python-pillow-avif-plugin
```bash
python generate_thumb.py --line1 "Spa" --line2 "Francorchamps" --qualif --image "https://media.formula1.com/image/upload/c_fit,h_704/q_auto/v1740000001/common/f1/2026/track/2026trackspafrancorchampsdetailed.webp"
```
