import mysql.connector

def reset_database():
    # Connexion à MySQL
    conn = mysql.connector.connect(
        host='localhost',
        user='root',
        password=''
    )
    cursor = conn.cursor()

    # Supprimer la base de données si elle existe
    cursor.execute("DROP DATABASE IF EXISTS quizly")
    
    # Créer une nouvelle base de données
    cursor.execute("CREATE DATABASE quizly CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
    
    print("Base de données réinitialisée avec succès!")
    
    cursor.close()
    conn.close()

if __name__ == "__main__":
    reset_database() 