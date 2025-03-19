import pymysql

try:
    # Stelle eine Verbindung zur MySQL-Datenbank her
    conn = pymysql.connect(
        host="localhost",  # IP-Adresse (oder 172.18.0.2, je nachdem, was du verwendest)
        user="root",  # Dein MySQL-Benutzername
        password="hello1234",  # Dein MySQL-Passwort
        database="TalentBridgeDB",  # Deine Datenbank
        port=3307  # Der Port, den du in Docker weiterleitest
    )

    # Stelle sicher, dass die Verbindung funktioniert, indem du die Tabellen abfragst
    cursor = conn.cursor()
    cursor.execute("SHOW TABLES;")
    tables = cursor.fetchall()
    print("Tabellen in der Datenbank:", tables)

    # Abfrage der Daten aus der Tabelle 'mitarbeiter'
    cursor.execute("SELECT * FROM mitarbeiter;")
    results = cursor.fetchall()

    if results:
        for row in results:
            print(row)  # Zeigt jede Zeile an
    else:
        print("Keine Daten gefunden.")

    # Schließe die Verbindung und den Cursor
    cursor.close()
    conn.close()

except Exception as e:
    print(f"❌ Fehler: {e}")
