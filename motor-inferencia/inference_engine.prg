*Program....: INFERENCE_ENGINE.PRG
*Made by....: Ing. Antonio Castañeda de la Lanza
*Comments...: Software que GENERA EL DIAGNOSTICO Y TRATAMIENTO EN EL SISTEMA XpertDiagnostic
*             Es la maquina de inferencia del sistema experto para el diagnostico de enfermedades
*             
*             Usa las tablas: 
*             IO_PACIENTES.DBF			
*             IO_SINTOMAS.DBF			BDC_SINTOMAS.DBF
*             IO_SIGNOS.DBF				BDC_SIGNOS.DBF
*             IO_LABS.DBF				BDC_LABS.DBF
*             IO_PLANES.DBF				BDC_LABSDIAGDIF.DBF
*             IO_TRATAMIENTOS.DBF		BDC_TRATAMIENTOS.DBF
*
*Date.......: Noviembre 24 de 2026

CLEAR
CLEAR ALL
CLOSE DATABASES
SET DELE ON
SET SAFETY OFF

*--- Se asume que ya hay registros de pacientes cargados y se recorrerá
*--- cada uno de ellos para generar su diagnostico y tratamiento
*--- SE ACCEDEN LAS TABLAS DE ENTRADA Y SALIDA, DONDE ESTÁN LOS PACIENTES Y SUS PADECIMIENTOS
SELE 1
USE io_pacientes 	ALIAS io_pacientes
inde on id_pacient to paso
SELE 2
USE io_sintomas 	ALIAS io_sintomas
inde on id_pacient to paso2
SELE 3
USE io_signos 		ALIAS io_signos
inde on id_pacient to paso3
SELE 4
USE io_resultadosesperados
inde on id_pacient to paso4
SELE 5
USE io_planes 		ALIAS io_planes
inde on id_pacient to paso5
SELE 6
USE io_tratamientos ALIAS io_tratamientos
inde on id_pacient to paso6
*--- RELACIONA LAS TABLAS DE ENTRADA / SALIDA
SELE 1
SET RELA TO id_pacient INTO b
SET RELA TO id_pacient INTO c
SET RELA TO id_pacient INTO d
SET RELA TO id_pacient INTO e
SET RELA TO id_pacient INTO f
*--- SE ACCEDEN LAS TABLAS DE LA BASE DE CONOCIMIENTO, DONDE SE BUSCARÁN LAS ENFERMEDADES Y TRATAMIENTOS
SELE 7
use bdc_enfermedades alias bdc_enfermedades
inde on id_enferme to paso7
SELE 8
USE bdc_sintomas ALIAS bdc_sintomas
inde on id_enferme to paso8
SELE 9
USE bdc_signos 		ALIAS bdc_signos
inde on id_enferme to paso9
SELE 10
USE bdc_tratamientos ALIAS bdc_tratamientos
inde on id_enferme to paso10
*--- RELACIONA LAS TABLAS DE LA BASE DE CONOCIMIENTO
SELE 7
SET RELA TO id_enferme INTO h
SET RELA TO id_enferme INTO i
SET RELA TO id_enferme INTO j
*--- 

PUBLIC cId_pacient, cId_enferme, cEnferme
PUBLIC cId_sintoma, cSintoma, cId_signos, cSignos
PUBLIC cId_labs, cEstudioLab
PUBLIC cId_labsdiagdif,cLdabDiagDif
PUBLIC cId_enfespe, cEnfespera
PUBLIC cId_tratam, cTratamient

DO inicia1

SELE io_pacientes
GO TOP
SCAN ALL
    *--- Toma el paciente
    SELE io_pacientes
	cId_pacient = io_pacientes->id_pacient
	*--- Busca al paciente en la tabla IO de Sintomas y filtra sus sintomas
	SELE io_sintomas
	SET FILTER TO io_sintomas->id_pacient=cId_pacient
	*--- 
	INDE ON sintomas to paso20 ADDITIVE
	SELE bdc_sintomas
	INDE ON sintomas to paso21 ADDITIVE
	SELE io_sintomas
	SET RELA TO sintomas INTO h
	SET FILTER TO (io_sintomas->sintomas=bdc_sintomas->sintomas .and. io_sintomas->id_pacient=cId_pacient)
	*--- Toma las enfermedades que corresponden a esos sintomas	
	COPY TO sintomas_temp TYPE FOX2X
	*--- Le agrega campos ENFERMEDAD y TRATAMIENTO para traerse el nombre de la enfermedad y el tratamiento
	SELE 20
	USE sintomas_temp
	ALTER TABLE sintomas_temp ADD COLUMN enfermedad C(90)
	ALTER TABLE sintomas_temp ADD COLUMN tratamient C(100)
	INDE ON id_enferme TO paso22 ADDITIVE
	SET RELA TO id_enferme INTO g
	REPLA ALL sintomas_temp->enfermedad WITH bdc_enfermedades->enfermedad
	SET RELA TO id_enferme INTO j
	REPLA ALL sintomas_temp->tratamient WITH bdc_tratamientos->tratamient
	*--- Indexa la enfermedad on UNIQUE
	INDE ON enfermedad to paso23 UNIQUE
	*--- AHORA BUSCA AL PACIENTE EN LA TABLA IO de Signos y filtra sus signos
	SELE io_signos
	SET FILTER TO io_signos->id_pacient=cId_pacient
	*--- 
	INDE ON signos to paso30 ADDITIVE
	SELE bdc_signos
	INDE ON signos to paso31 ADDITIVE
	SELE io_signos
	SET RELA TO signos INTO i
	SET FILTER TO (io_signos->signos=bdc_signos->signos .and. io_signos->id_pacient=cId_pacient)
	*--- Toma las enfermedades que corresponden a esos signos
	COPY TO signos_temp TYPE FOX2X
	*--- Le agrega el campo ENFERMEDAD para traerse el nombre de la enfermedad de la BDC_Enfermedades
	SELE 21
	USE signos_temp
	ALTER TABLE signos_temp ADD COLUMN enfermedad C(90)
	ALTER TABLE signos_temp ADD COLUMN tratamient C(100)
	INDE ON id_enferme TO paso32 ADDITIVE
	SET RELA TO id_enferme INTO g
	REPLA ALL signos_temp->enfermedad WITH bdc_enfermedades->enfermedad
	SET RELA TO id_enferme INTO j
	REPLA ALL signos_temp->tratamient WITH bdc_tratamientos->tratamient
	*--- Cuenta la enfermedad que aparece mas veces, indexa on UNIQUE
	INDE ON enfermedad TO paso33 UNIQUE
	*--- GUARDA LAS ENFERMEDADES Y TRATAMIENTOS RESULTANTES CON UN APPEND FROM EN la tabla io_resultadosesperados
	SELE 4
	APPEND FROM sintomas_temp 	FIELDS id_pacient, id_enferme, enfermedad, tratamient
	APPEND FROM signos_temp 	FIELDS id_pacient, id_enferme, enfermedad, tratamient
	INDE ON enfermedad TO paso40 UNIQUE
	COPY TO archivo_temp TYPE FOX2X
	ZAP
	APPEND FROM archivo_temp
	SELE 20
	USE
	SELE 21
	USE
	DO inicia2
ENDSCAN

*---
RETURN

*----------------
PROCEDURE inicia1
*---
STORE " " TO cId_pacient, cId_enferme, cEnferme
STORE " " TO cId_sintoma, cSintoma, cId_signos, cSignos
STORE " " TO cId_labs, cEstudioLab
STORE " " TO cId_labsdiagdif,cLdabDiagDif
STORE " " TO cId_enfespe, cEnfespera
STORE " " TO cId_tratam, cTratamient
*---
RETURN


*----------------
PROCEDURE inicia2
*---
STORE " " TO cId_pacient, cId_enferme, cEnferme
STORE " " TO cId_sintoma, cSintoma, cId_signos, cSignos
STORE " " TO cId_labs, cEstudioLab
STORE " " TO cId_labsdiagdif,cLdabDiagDif
STORE " " TO cId_enfespe, cEnfespera
STORE " " TO cId_tratam, cTratamient
RETURN

