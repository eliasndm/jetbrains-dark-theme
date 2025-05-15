#!/opt/miniconda3/bin/python
import os
from shutil import copytree, copy
import optimize_theme


THEME_DIRNAME = "jetbrains-dark"
THEME_NAME = "jetbrains-dark-syntax.json"


scripts_dir = os.path.dirname(os.path.abspath(__file__))
repo = os.path.dirname(scripts_dir)
dist = os.path.join(repo, "dist")
dist_pub = os.path.join(dist, THEME_DIRNAME)

# Build package
copy(os.path.join(repo, "LICENSE.txt"), dist_pub)
copy(os.path.join(repo, "package.json"), dist_pub)
copy(os.path.join(repo, "README.md"), dist_pub)
copy(os.path.join(repo, "CHANGELOG.md"), dist_pub)
copytree(os.path.join(repo, "themes"), os.path.join(dist_pub, "themes"), dirs_exist_ok=True)

# Optimize the theme
theme_path = os.path.join(dist_pub, "themes", THEME_NAME)
optimize_theme.main(theme_path, theme_path, combine=True, dedupe=True, sort=True, minify=True)
