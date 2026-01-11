## Setup uputstva

1. Preuzimanje komponenti:
   * preuzmite backend s https://github.com/dbrckan22/CyberEvidencePortalBackend.git
   * preuzmite frontend s https://github.com/dbrckan22/Evidence-Portal-for-the-Croatian-Cybersecurity-Act-and-Regulation/tree/Frontend

2. Kreiranje lokalne baze podataka
   * otvorite SQL Server Management Studio (ili bilo koji drugi alat po izboru)
   * kreirajte novu bazu podataka kako biste imali sve potrebne podatke lokalno
   * uvezite .bak datoteku u bazu (možete je pronaći u ovoj mapi pa je preuzimite odavde)

3. Konfiguracija backend-a
   * otvorite datoteku appsettings.json (i appsettings.Development.json) u C# projektu
   * u dijelu "DefaultConnection" promijenite postavku Server da pokazuje vašu lokalnu instancu SQL Server-a (npr. "Server=localhost;Database=SIS_projekt;Trusted_Connection=True;TrustServerCertificate=True;")

4. Pokretanje backenda
   * otvorite Visual Studio i učitajte .sln datoteku projekta
   * pokrenite projekt pritiskom na F5 ili klikom na "Start Debugging"
   * provjerite da backend radi ispravno i da je povezan s lokalnom bazom
     
5. Pokretanje frontenda
   * otvorite frontend folder
   * pokrenite index.html dvostukim klikom u pregledniku
   * frontend će se povezati na lokalno pokrenuti backend i moći ćete testirati aplikaciju
