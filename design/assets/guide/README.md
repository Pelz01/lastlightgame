# Visual handbook assets

The eight WebP files in design/runtime pair real desktop and phone views of the map, loading, travel and selling. Each has a lossless PNG master here; manifest.json records sizes and the completed first delivery.

Capture with LAST_LIGHT_TEST_ORIGIN pointing at a running development server, then run node scripts/capture-guide.mjs. The script adds numbered outlines to actual controls; it does not invent game state. Desktop uses a 1366 × 900 viewport and the full game layout. Phone uses 390 × 844 and the actual responsive action panel. The guide chooses the matching source at 760 px and enlarges that same source.

These optional images load only in the handbook. Their separate combined budget is 300 KB. Game assets retain the 1.2 MB core budget.
