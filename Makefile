all: bin/pgcc_debug_gui.nw


bin:
	mkdir -p bin
	
bin/pgcc_debug_gui.nw: bin src/js/plugs/* src/css/* src/html/* src/js/* src/js/utils/* src/js/views/* src/js/ui/*  src/js/lib/* src/package.json
	cd src; zip -r ../bin/pgcc_debug_gui.nw .

	
install: bin/pgcc_debug_gui.nw
	@sudo rm -f /usr/local/bin/pgcc_debug_gui
	@ln -sf `pwd`/pgcc_debug_gui /usr/local/bin/pgcc_debug_gui
	@ln -sf `pwd`/pgcc_debug_gui /usr/local/bin/pgdb
	@cp resources/pgcc_debug_gui.desktop /usr/share/applications/
	@chmod a+wrx /usr/share/applications/pgcc_debug_gui.desktop
	@cp resources/mime*.xml /usr/share/mime/packages/
	@cp resources/pgcc_debug_gui-48x48.png /usr/share/icons/hicolor/48x48/apps/
	@update-mime-database /usr/share/mime