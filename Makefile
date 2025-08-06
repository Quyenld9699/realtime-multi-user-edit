up:
	chmod +x deploy-vps.sh && ./deploy-vps.sh $(hostname -I | awk '{print $1}')