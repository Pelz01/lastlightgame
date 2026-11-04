# Hosted Last Light

The public URL and existing Sites identity are recorded in deployment.json. Reuse that project; do not register another Site. The publishing checkout is hosting/site, a separate private source repository managed by the Sites workflow. Run npm run build:site from the project root to prepare its static dist. Preserve hosting/site/.openai/hosting.json when updating. Package/push from that checkout, not the original GitHub repository. The public source is https://github.com/Pelz01/lastlightgame; the Sites publishing repository is separate.
