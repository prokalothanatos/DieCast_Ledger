# DieCast_Ledger
Inventory and estimate value of your diecast car collection

**DieCast Ledger** is a seller's workbench for die-cast cars. Photograph a car or box set, let research identify it, price it from real sold listings and write its eBay title, review it on a page laid out like eBay's own listing form, and keep the whole collection in one place (the *Garage*).

## Try the demo

**Live demo:** https://prokalothanatos.github.io/DieCast_Ledger/

It runs entirely in your browser with three sample cars:

| Sample | What it shows |
|---|---|
| Carded car (Item 1166) | the eBay-style page with every field, dropdowns that match eBay's lists, blank required fields marked red, condition wording choices |
| Loose car, listed on eBay (Item 1070) | editing a live listing in place, *Apply to eBay*, *Read from eBay* and *End Active Listing* (all simulated) |
| Box set (Item 1167) | six photos of the box, research notes showing where each value came from, UPC read from the box bottom |

**Nothing is sent to eBay or saved anywhere except your own browser tab.** *Reset demo* puts everything back.

To run the demo on your own computer, open a terminal in this folder and run `python -m http.server 8000`, then browse to http://localhost:8000.

## What the full app does (not included in this demo)
- Takes photos from a phone (USB or Wi-Fi), crops and straightens them
- Identifies the car with Google Lens, then checks the **Hot Wheels Wiki** for the casting name, year and series
- Finds the price and the wording sellers use from sold eBay listings (Mercari as a backup when there are few)
- Builds the eBay draft for you to review and publish yourself
- Keeps a collection database with photos, values and listing status

## Notes
- This is an unofficial hobby project. It is not affiliated with, endorsed by or sponsored by Mattel, Hot Wheels, eBay or Google. Hot Wheels is a trademark of Mattel, Inc.
- The sample photos are the author's own.
- No license has been chosen yet, so all rights are reserved for now.
