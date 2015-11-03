# echo "* Compiling all sass in wtd-dev"

# echo "Compiling general"
# cd ~/dev/wtd-dev/platform/commonUI/general/res/
# compass compile --force

echo "*** Compiling themes/espresso"
cd ~/dev/wtd-dev/platform/commonUI/themes/espresso/res/
compass compile --force

echo "** Compiling themes/snow"
cd ~/dev/wtd-dev/platform/commonUI/themes/snow/res/
compass compile --force

echo "**** All wtd-dev sass compiled"