import psycopg2

try:
    connetion = psycopg2.connect(
        host = 'localhost',
        user = 'postgres',
        password = 'Troyax212005',
        database = 'HACKATON_DB'
    )

    print("Conexion exitosa")

except Exception as ex:
    print(ex)