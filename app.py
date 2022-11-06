from email import message
import os
import asyncio
from time import sleep
import websockets
import threading



# -----------------------Thread1: crear ficheros-------------------------- 
print('esperando conexion')
def crearFicheros():
    

    fileNameAdmin='files/conf.txt'
    fileName='files/file'
    maxLine=100 #3600
    currentFile=1


    if not(os.path.exists(fileNameAdmin)):
        print('create conf file')
        f = open(fileNameAdmin, "a")
        f.write('1')
        currentFile = 1
        f.close()
    else:
        print('existe conf file')
        f = open(fileNameAdmin, "r")
        currentFile = f.readline()
        f.close()

   


    while(True):
        f = open(fileNameAdmin, "r")
        currentFile=f.readline()
        f.close()

        #Bloquear servidor
        if(currentFile!='0' and currentFile!=''):
            
            ###################################33333

            # Escribir en el fichero
            message='2022-04-12  20º  21'  #timestamp Co2...
            sleep(1)# Para que cada segundo escriba 1 linea

            ###################################33333

            #Crear nuevo fichero si el fichero no existe:
            if not(os.path.exists(fileName+str(currentFile)+".txt")):
                 print('New File: '+fileName+str(currentFile)+".txt")

            #Escribir en el fchero:
            f = open(fileName+str(currentFile)+".txt", "a")
            f.write(message+'\n')
            f.close()

            
            #Calcular lineas del fichero
            f = open(fileName+str(currentFile)+".txt", "r")
            lines = len(f.readlines())
            f.close()

            #Si el archivo esta lleno , actualizar currentfile para crear nuevo fichero
            if(lines>=maxLine): 
                
                f = open(fileNameAdmin, "w")
                currentFile=int(currentFile)+1
                f.write(str(currentFile))
                f.close()

                      
# -----------------------Thread1: servidor---------------------------- 
async def handler(ws, path):
        fileNameAdmin='files/conf.txt'

        #Bloquear servidor para que no siga metiendo lineas
        f = open(fileNameAdmin, "w")
        f.write('0')
        f.close()

        sleep(4) #esperar para que el servidor se bloquee
        print('Servidor bloqueado')
       
        dir_name = "files/"
         
        #Enviar los txt como string mediante websoket
        #Eliminar los txt
        files = os.listdir(dir_name)
        for file in files:
            if file.startswith("file"):
                #print (file)
                with open('files/'+file,'r') as f:
                    lines = f.read()
                    f.close()
                    await ws.send(lines)
                os.remove(os.path.join(dir_name, file))

        print('Archivos subidos')    
        print('Archivos eliminados')


        #Desbloquear servidor
        f = open(fileNameAdmin, "w")
        f.write('1')
        f.close()
        print('servidor desbloqueado')


def serverStarter(loop, server):
    #starting websocket server
    print('Starting Server…')
    asyncio.set_event_loop(loop)
    asyncio.get_event_loop().run_until_complete(server)
    loop.run_forever()

#starting websocket server thread
start_server = websockets.serve(handler, "127.0.0.1",  5001)
eventLoop = asyncio.get_event_loop()


#--------------------------threads ---------------------------
t1 = threading.Thread(name='createFile', target=crearFicheros)
t2 = threading.Thread(target = serverStarter, args = [eventLoop, start_server])


t1.start()
t2.start()


