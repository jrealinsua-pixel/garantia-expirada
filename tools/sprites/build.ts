// npm run sprites: draws every sprite by code and exports them to public/assets/.
// public/assets/sprites.json lists each sheet and its frame size; the game loads from it.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Canvas, hx, scaled } from '../../src/art/canvas.ts';
import { buildRoom } from '../../src/sim/room.ts';
import { HUB, ROOMS } from '../../src/data/rooms.ts';
import { paintRoom } from '../../src/art/room.ts';
import {
  NEVERA_POSES, makeNevera, miniDryer, miniStapler,
} from './characters.ts';
import {
  makeFotocopiadoraFrames,
  makeSelloFrames, makeClimatizadorFrames } from './enemies.ts';
import { ITEM_GRIDS, makeItem } from './items.ts';
import * as P from './props.ts';
import { makeRepetidorFrames, makeRouterFrames } from './router.ts';
import * as LV from './lavadora.ts';
import * as NB from './nube.ts';
import * as CO from './consola.ts';
import { makeBrokenBox, makeMunecoFrames, makeTagFrames, MUNECO_H, MUNECO_W, TAG_H, TAG_W } from './muneco.ts';
import * as DR from './director.ts';
import * as CT from './centralita.ts';
import * as CL from './clientela.ts';
import * as TL from './taller.ts';
import * as TR from './trituradora.ts';
import * as FN from './final.ts';
import { makeMiniMegaphone, makeSoundWave } from './megafono.ts';
import { makeMeritSeal } from './meritos.ts';
import { makeLabelShot, makeMiniLabeller, makeStuckLabels } from './etiquetadora.ts';
import { makeInfraredPulse, makeMiniRemote, makeMiniSolderingIron, makeTinDrop, makeTinPuddle } from './premios.ts';
import * as H from './mostrador.ts';
import * as BV from './batidora-vaso.ts';
import * as MV from './movil.ts';
import { BECARIO_H, BECARIO_W, makeBecarioHand, makeBecarioSheet } from './becario.ts';
import * as PV from './plancha-vapor.ts';
import * as DS from './despiece.ts';
import * as ES from './estanteria.ts';
import { makeJug } from './garrafa.ts';
import * as P2 from './planta2-nuevo.ts';
import * as P3 from './planta3-nuevo.ts';
import * as P4 from './planta4-nuevo.ts';
import * as P1 from './planta1-nuevo.ts';
import { encodePng } from './png.ts';
import { TOASTER_H, TOASTER_W, makeToasterHand, makeToasterSheet } from './tostadora.ts';
import { incomingSheets } from './entrada.ts';
import { ROOT } from '../lib/deps.ts';

export interface SheetInfo {
  file: string;
  frameW: number;
  frameH: number;
  frames: number;
}

function strip(frames: Canvas[]): Canvas {
  const w = frames[0]!.w;
  const h = frames[0]!.h;
  const out = new Canvas(w * frames.length, h);
  frames.forEach((f, i) => out.blit(f, i * w, 0));
  return out;
}

export function allSheets(): Record<string, { canvas: Canvas; frameW: number; frameH: number }> {
  const one = (c: Canvas) => ({ canvas: c, frameW: c.w, frameH: c.h });
  const sheets: Record<string, { canvas: Canvas; frameW: number; frameH: number }> = {
    // M14c (a4a): the toaster in the new style (tools/sprites/tostadora.ts) and its glove.
    tostadora: { canvas: strip(makeToasterSheet()), frameW: TOASTER_W, frameH: TOASTER_H },
    'mano-tostadora': one(makeToasterHand()),
    // M13 (3): the Batidora de Vaso, the same eight frames as the toaster (CharacterLook).
    'batidora-vaso': { canvas: strip(BV.makeBlenderSheet()), frameW: BV.BLENDER_W, frameH: BV.BLENDER_H },
    'mano-batidora': one(BV.makeBlenderHand()),
    'giro-cuchillas': { canvas: strip(BV.makeWhirlFrames()), frameW: BV.WHIRL_SIZE, frameH: BV.WHIRL_SIZE },
    'arma-picahielos': one(BV.makeMiniIceCrusher()),
    'bala-cubito-zumo': one(BV.makeJuiceCube()),
    // The playable characters (M13): the same eight frames as the toaster (CharacterLook).
    becario: { canvas: strip(makeBecarioSheet()), frameW: BECARIO_W, frameH: BECARIO_H },
    'mano-becario': one(makeBecarioHand()),
    // M13 (4): the Plancha de Vapor, her starch spray and the steam her soleplate leaves.
    'plancha-vapor': { canvas: strip(PV.makeIronSheet()), frameW: PV.IRON_W, frameH: PV.IRON_H },
    'mano-plancha': one(PV.makeIronHand()),
    'vapor-suela': { canvas: strip(PV.makeSteamFrames()), frameW: PV.STEAM_W, frameH: PV.STEAM_H },
    'arma-almidon': one(PV.makeMiniStarchSpray()),
    'bala-almidon': one(PV.makeStarchDrop()),
    movil: { canvas: strip(MV.makePhoneSheet()), frameW: MV.PHONE_W, frameH: MV.PHONE_H },
    'movil-apagado': one(MV.makePhoneOff()),
    'mano-movil': one(MV.makePhoneHand()),
    'arma-notificaciones': one(MV.makeNotifier()),
    'bala-notificacion': one(MV.makeNotification()),
    'bateria-baja': one(MV.makeLowBattery()),
    // M13 (7c): what flies off each character when it goes down (the toaster's is `despiece`).
    'despiece-batidora': { canvas: DS.makeBlenderBits(), frameW: 8, frameH: 8 },
    'despiece-plancha': { canvas: DS.makeIronBits(), frameW: 8, frameH: 8 },
    'despiece-becario': { canvas: DS.makeInternBits(), frameW: 8, frameH: 8 },
    'despiece-movil': { canvas: DS.makePhoneBits(), frameW: 8, frameH: 8 },
    // Frame 0 of every enemy sheet is its approved (or first) sprite; the order of the rest is in
    // the enemy's `anim` (src/data/enemies.ts).
    // M14c (a5a): the new style (tools/sprites/planta1-nuevo.ts); the old ones stay in art/referencia/.
    aspirador: { canvas: strip(P1.makeAspiradorNuevoFrames()), frameW: P1.ASPIRADOR_W, frameH: P1.ASPIRADOR_H },
    microondas: { canvas: strip(P1.makeMicroondasNuevoFrames()), frameW: P1.MICROONDAS_W, frameH: P1.MICROONDAS_H },
    bombilla: { canvas: strip(P1.makeBombillaNuevaFrames()), frameW: P1.BOMBILLA_W, frameH: P1.BOMBILLA_H },
    polilla: { canvas: strip(P1.makePolillaNueva()), frameW: P1.POLILLA_W, frameH: P1.POLILLA_H },
    batidora: { canvas: strip(P1.makeBatidoraNuevaFrames()), frameW: P1.BATIDORA_W, frameH: P1.BATIDORA_H },
    mando: { canvas: strip(P1.makeMandoNuevoFrames()), frameW: P1.MANDO_W, frameH: P1.MANDO_H },
    impresora: { canvas: strip(P2.makeImpresoraNuevaFrames()), frameW: P2.IMPRESORA_W, frameH: P2.IMPRESORA_H },
    cargador: { canvas: strip(P2.makeCargadorNuevoFrames()), frameW: P2.CARGADOR_W, frameH: P2.CARGADOR_H },
    'raton-inalambrico': { canvas: strip(P2.makeRatonNuevoFrames()), frameW: P2.RATON_W, frameH: P2.RATON_H },
    webcam: { canvas: strip(P2.makeWebcamNuevaFrames()), frameW: P2.WEBCAM_W, frameH: P2.WEBCAM_H },
    // Floor 3 (Juguetería), M14c (a6a) in the new style (tools/sprites/planta3-nuevo.ts):
    // 0-1 standing, 2-5 marching, 6 run down, 7-8 winding itself up.
    'robot-cuerda': { canvas: strip(P3.makeRobotNuevoFrames()), frameW: P3.ROBOT_W, frameH: P3.ROBOT_H },
    // 0-1 idling, 2-3 driving, 4 revving to ram, 5 overturned, 6 batteries out.
    'coche-teledirigido': { canvas: strip(P3.makeCocheNuevoFrames()), frameW: P3.COCHE_W, frameH: P3.COCHE_H },
    // The workshop's own (M12 (3c)): taller.ts names the frames (FORK_FRAMES).
    carretilla: { canvas: strip(TL.makeCarretillaFrames()), frameW: TL.FORK_W, frameH: TL.FORK_H },
    // 0-1 standing, 2-5 waddling, 6 lid up (about to throw); and the pieces it throws (4 kinds).
    // M14c (a6b): the bucket and the envelope in the new style (planta3-nuevo.ts); (a6b2) the pieces
    // and the figurines too.
    'cubo-piezas': { canvas: strip(P3.makeCuboNuevoFrames()), frameW: P3.CUBO_W, frameH: P3.CUBO_H },
    pieza: { canvas: strip(P3.makePiezasNuevas()), frameW: P3.PIEZA_W, frameH: P3.PIEZA_H },
    // 0-1 standing, 2 crouching, 3 in the air, 4 about to spit; and what comes out of it.
    'sobre-sorpresa': { canvas: strip(P3.makeSobreNuevoFrames()), frameW: P3.SOBRE_W, frameH: P3.SOBRE_H },
    // Floor 4 (Oficinas): seven frames a side (side, front, back): 0-1 humming, 2-5 shuffling, 6 blades red.
    // M14c (a6c1): in the new style (planta4-nuevo.ts).
    destructora: { canvas: strip(P4.makeDestructoraNuevaFrames()), frameW: P4.SHRED_W, frameH: P4.SHRED_H },
    // 0-1 humming, 2-5 shuffling, 6-8 lid up and the green light crossing the glass, 9 a copy coming out.
    fotocopiadora: { canvas: strip(makeFotocopiadoraFrames()), frameW: 38, frameH: 38 },
    // 0-1 standing, 2 crouching, 3 in the air, 4 coming down to stamp, 5 just stamped.
    sello: { canvas: strip(makeSelloFrames()), frameW: 26, frameH: 34 },
    // 0-1 humming, 2-5 dragging itself along, 6 rime on the vent (about to blow).
    climatizador: { canvas: strip(makeClimatizadorFrames()), frameW: 28, frameH: 40 },
    // What comes out of the envelope (M14c (a6b2), planta3-nuevo.ts): 0-1 standing, 2-5 running, 6 biting.
    'munequito-repetido': { canvas: strip(P3.makeMunequitoNuevoFrames(false)), frameW: P3.MUNE_W, frameH: P3.MUNE_H },
    'munequito-dorado': { canvas: strip(P3.makeMunequitoNuevoFrames(true)), frameW: P3.MUNE_W, frameH: P3.MUNE_H },
    // Frames 0-5, door shut (breathing and walking, NEVERA_POSES); 6-11, the same with the door open.
    'nevera-suprema': { canvas: strip([false, true].flatMap((open) => NEVERA_POSES.map((f) => makeNevera(open, f.pose)))), frameW: 72, frameH: 76 },
    // Floor 1's second boss (M14 (j2)): seven frames per program (rest, breathing, walking, weighing the
    // load), Prelavado 0-6, Lavado 7-13, Centrifugado 14-20; its soap bubbles and odd socks.
    'lavadora-eco': { canvas: strip(LV.makeLavadoraFrames()), frameW: LV.LAVADORA_W, frameH: LV.LAVADORA_H },
    'bala-espuma': { canvas: LV.makeFoamBullet(), frameW: 16, frameH: 16 },
    'bala-calcetin': { canvas: LV.makeSockBullet(), frameW: 12, frameH: 12 },
    // Floor 2's second boss (M14 (j3)): six frames per phase (floating 0-3, holding its breath,
    // the error), «Subiendo archivos» 0-5 and «Almacenamiento lleno» 6-11; its folders, rain and files.
    'nube-almacenamiento': { canvas: strip(NB.makeNubeFrames()), frameW: NB.NUBE_W, frameH: NB.NUBE_H },
    'carpeta-nube': one(NB.makeCarpeta()),
    'bala-gota': { canvas: NB.makeDropBullet(), frameW: 10, frameH: 10 },
    'bala-archivo': { canvas: NB.makeFileBullet(), frameW: 12, frameH: 12 },
    // M14 (j4): La Consola Edición Coleccionista, its loot boxes, cartridges and fake coupons.
    'consola-coleccionista': { canvas: strip(CO.makeConsolaFrames()), frameW: CO.CONSOLA_W, frameH: CO.CONSOLA_H },
    'caja-botin': { canvas: strip(CO.makeCajaBotinFrames()), frameW: CO.CAJA_W, frameH: CO.CAJA_H },
    'bala-cartucho': { canvas: CO.makeCartridgeBullet(), frameW: 12, frameH: 12 },
    'bala-cupon-falso': { canvas: CO.makeFakeCouponBullet(), frameW: 12, frameH: 12 },
    // Floor 2's boss: 0-5 awake (rest, breathing, walking), 6-11 rebooting with 0 to 5 LEDs lit.
    'router-wifi': { canvas: strip(makeRouterFrames()), frameW: 72, frameH: 76 },
    // Its repeater: 0-1 on (the LED blinks), 2 unplugged.
    repetidor: { canvas: strip(makeRepetidorFrames()), frameW: 20, frameH: 24 },
    // Floor 3's boss: 0-5 boxed, 6 boxed posing, 7-12 out of the box, 13 posing, 14-15 spinning.
    'muneco-moda': { canvas: strip(makeMunecoFrames()), frameW: MUNECO_W, frameH: MUNECO_H },
    // The tag on its box (muneco.ts TAG_ANCHOR): full price, −30 %, −50 %, −70 %.
    'etiqueta-rebaja': { canvas: strip(makeTagFrames()), frameW: TAG_W, frameH: TAG_H },
    // The box it breaks out of in phase 3, left in the room as an obstacle.
    'caja-muneco': one(makeBrokenBox()),
    // Floor 4's boss (M10 planta 4 5a): director.ts DIRECTOR_FRAMES names each frame.
    'director-rrhh': { canvas: strip(DR.makeDirectorFrames()), frameW: DR.DIRECTOR_W, frameH: DR.DIRECTOR_H },
    // His chair on its own in phase 3: 0 still, 1-2 rolling, 3 about to ram.
    'silla-director': { canvas: strip(DR.makeChairFrames()), frameW: DR.CHAIR_W, frameH: DR.CHAIR_H },
    'bala-tarjeta-visita': { canvas: DR.makeBusinessCard(), frameW: 10, frameH: 8 },
    'carta-despido': { canvas: DR.makeDismissalLetter(), frameW: 12, frameH: 10 },
    'bala-diapositiva': { canvas: DR.makeSlide(), frameW: 9, frameH: 9 },
    'bala-recorte': one(DR.makeCut()),
    // The Sala de Juntas: a partition that slides (0) and where it is going (1); the long table.
    'mampara-movil': { canvas: strip(DR.makePartitionFrames()), frameW: DR.PARTITION_W, frameH: DR.PARTITION_H },
    'mesa-juntas': one(DR.makeBoardTable()),
    // Floor 5's boss (M11 5a): centralita.ts CENTRALITA_FRAMES names each frame.
    centralita: { canvas: strip(CT.makeCentralitaFrames()), frameW: CT.CENTRALITA_W, frameH: CT.CENTRALITA_H },
    'bala-clavija': one(CT.makePlugBullet()),
    // The final boss (M12 (4a)): trituradora.ts TRITURADORA_FRAMES names each frame.
    trituradora: { canvas: strip(TR.makeTrituradoraFrames()), frameW: TR.TRITURADORA_W, frameH: TR.TRITURADORA_H },
    // Its phase 2, «Despiece» (M12 (4b)): the parts it spits out (two frames each), the belt over the
    // floor and the intake rollers at its end.
    'bala-tornillo': { canvas: TR.makeScrewBullet(), frameW: 10, frameH: 10 },
    'bala-muelle': { canvas: TR.makeSpringBullet(), frameW: 10, frameH: 10 },
    'bala-tecla': { canvas: TR.makeKeyBullet(), frameW: 10, frameH: 10 },
    'cinta-despiece': one(TR.makeBeltTile()),
    'rodillos-despiece': { canvas: TR.makeIntakeTiles(), frameW: 16, frameH: 24 },
    // «Control de calidad» (M12 (4c)): the «APTO» label on the floor and the stacks of crates.
    'etiqueta-apto': one(TR.makeAptoLabel()),
    // Her «EN SERVICIO» plate, drawn unflipped over the body so it reads both ways (EnemyAnim.badge).
    'placa-servicio': one(TR.makeServicePlate()),
    'etiqueta-apto-vuelo': { canvas: TR.makeAptoLabelFlying(), frameW: 14, frameH: 9 },
    'pila-cajas': one(TR.makeCrateStack()),
    // Phase 3's cords swept round: a coil of curly cord, two frames a quarter-turn apart (M11 5c).
    'bala-cable': { canvas: strip(CT.makeCordCoils()), frameW: 10, frameH: 10 },
    // The hold music: 0 a quaver, 1 two beamed notes.
    'nota-espera': { canvas: strip(CT.makeHoldNotes()), frameW: 9, frameH: 10 },
    // Her room's low counters: one frame per department (CT.DEPARTMENTS), and the vertical one.
    'mostrador-bajo': { canvas: strip(CT.makeLowCounterFrames()), frameW: CT.LOW_COUNTER_W, frameH: CT.LOW_COUNTER_H },
    'mostrador-bajo-v': one(CT.makeLowCounterV()),
    // The voice menu's zones on the floor: 0-2 «Pulse 1-3» waiting, 3-5 the same with bullets coming.
    'zona-menu': { canvas: strip(CT.makeMenuZoneFrames()), frameW: CT.ZONE_W, frameH: CT.ZONE_H },
    // Floor 5's enemies (M11 4s): clientela.ts names each sheet's frames (DISP_FRAMES, POST_FRAMES, AV_FRAMES, PHONE_FRAMES).
    'dispensador-turnos': { canvas: strip(CL.makeDispensadorFrames()), frameW: CL.DISP_W, frameH: CL.DISP_H },
    // Its tickets (0 flat, 1 fluttering) and the turn circle on the floor (0 called, 1 attended, 2 lost).
    'tique-turno': { canvas: strip(CL.makeTicketBullets()), frameW: 9, frameH: 7 },
    'circulo-turno': { canvas: strip(CL.makeTurnCircleFrames()), frameW: CL.TURN_SIZE, frameH: CL.TURN_SIZE },
    // 0-7 the clean post, 8-15 the one with the chipped foot (the same frames).
    'poste-cola': { canvas: strip([...CL.makePosteFrames(false), ...CL.makePosteFrames(true)]), frameW: CL.POST_W, frameH: CL.POST_H },
    'cinta-poste': { canvas: strip(CL.makeBeltFrames()), frameW: CL.BELT_W, frameH: CL.BELT_H },
    'bola-acero': one(CL.makeSteelBall()),
    'asistente-virtual': { canvas: strip(CL.makeAsistenteFrames()), frameW: CL.AV_W, frameH: CL.AV_H },
    // Its speech bubbles (0 flying, 1 «…»), the FAQ shield (0 up, 1 fading) and «¿Le he ayudado?» (0 SÍ, 1 NO).
    bocadillo: { canvas: strip(CL.makeBubbleFrames()), frameW: 11, frameH: 9 },
    'escudo-faq': { canvas: strip(CL.makeFaqShieldFrames()), frameW: CL.FAQ_W, frameH: CL.FAQ_H },
    'boton-ayuda': { canvas: strip(CL.makeHelpButtons()), frameW: 13, frameH: 10 },
    'telefono-recepcion': { canvas: strip(CL.makeTelefonoFrames()), frameW: CL.PHONE_W, frameH: CL.PHONE_H },
    'bala-llamada': { canvas: strip(CL.makeCallBullets()), frameW: 13, frameH: 13 },
    maniqui: one(P.makeManiqui()),
    'arma-secador': one(miniDryer()),
    'arma-grapadora': one(miniStapler()),
    'arma-plancha': one(P.makeMiniIron()),
    'bala-grapa': one(P.makeStaple()),
    'bala-vapor': one(P.makeSteam()),
    // Floor 5's weapons (M11 6c).
    'arma-megafono': one(makeMiniMegaphone()),
    // M14 (l2): the achievements' seal.
    'sello-merito': one(makeMeritSeal()),
    'bala-onda': one(makeSoundWave()),
    'arma-etiquetadora': one(makeMiniLabeller()),
    'bala-etiqueta': one(makeLabelShot()),
    'etiqueta-pegada': { canvas: makeStuckLabels(), frameW: 7, frameH: 6 },
    // M14 (l4b): the prize weapons.
    'arma-soldador': one(makeMiniSolderingIron()),
    'bala-estano': one(makeTinDrop()),
    'charco-estano': { canvas: makeTinPuddle(), frameW: 12, frameH: 10 },
    'arma-mando': one(makeMiniRemote()),
    'bala-infrarrojo': one(makeInfraredPulse()),
    mano: one(P.makeHand()),
    caja: one(P.makeCaja()),
    barril: one(P.makeBarril()),
    carrito: one(P.makeCarrito()),
    // M14b (h11a1): the Regleta Sobrecargada, the same on every floor: 0 live, 1 resting.
    regleta: { canvas: strip(P.makeRegletaFrames()), frameW: 24, frameH: 18 },
    // M14b (h11a2): the Estantería Inestable, the same on every floor: standing (0 whole, 1
    // battered) and lying (on its side, face down, on its back, in a heap).
    estanteria: { canvas: strip(ES.makeShelfFrames()), frameW: ES.SHELF_W, frameH: ES.SHELF_H },
    'estanteria-caida-lado': one(ES.makeShelfFallenSide()),
    'estanteria-caida-frente': one(ES.makeShelfFallenFront()),
    'estanteria-caida-espalda': one(ES.makeShelfFallenBack()),
    'estanteria-monton': one(ES.makeShelfHeap()),
    // M14b (h11a3): the Garrafa de agua, the same on every floor.
    garrafa: one(makeJug()),
    // Floor 2 (Informática): the same obstacles and shutters with the floor's look (`<id>-2`).
    'caja-2': one(P.makeMonitorCrt()),
    'barril-2': one(P.makeWaterCooler()),
    'carrito-2': one(P.makeOfficeChair()),
    // Floor 3 (Juguetería): a dolls' house, a helium tank with balloons, a rocking horse.
    'caja-3': one(P.makeDollhouse()),
    'barril-3': one(P.makeHeliumTank()),
    'carrito-3': one(P.makeRockingHorse()),
    // Floor 4 (Oficinas): a filing cabinet, the coffee urn of the meeting room, a plastic plant.
    'caja-4': one(P.makeFilingCabinet()),
    'barril-4': one(P.makeCoffeeUrn()),
    'carrito-4': one(P.makeOfficePlant()),
    // Floor 5 (Atención al Cliente): bolted waiting chairs, the complaints box, the wet floor sign.
    'caja-5': one(P.makeWaitingChairs()),
    'barril-5': one(P.makeComplaintsBox()),
    'carrito-5': one(P.makeWetFloorSign()),
    // Floor 6 (Taller de Reacondicionado): crates of parts, a drum of used grease, a pallet jack.
    'caja-6': one(P.makePartsCrates()),
    'barril-6': one(P.makeGreaseDrum()),
    'carrito-6': one(P.makePalletJack()),
    // M9b (13b): the table that tips over: 0 standing, tipped to face 1 N, 2 S, 3 E, 4 W.
    mesa: { canvas: strip(P.makeTableFrames(1)), frameW: 28, frameH: 28 },
    'mesa-2': { canvas: strip(P.makeTableFrames(2)), frameW: 28, frameH: 28 },
    'mesa-3': { canvas: strip(P.makeTableFrames(3)), frameW: 28, frameH: 28 },
    'mesa-4': { canvas: strip(P.makeTableFrames(4)), frameW: 28, frameH: 28 },
    'mesa-5': { canvas: strip(P.makeTableFrames(5)), frameW: 28, frameH: 28 },
    'mesa-6': { canvas: strip(P.makeTableFrames(6)), frameW: 28, frameH: 28 },
    'bala-jugador': one(P.makeShot()),
    // Plastilina Mezclada: a stuck bullet (0-1 wobbling, 2-3 with glitter for Manualidades).
    'pegote-plastilina': { canvas: strip(P.makePegoteFrames()), frameW: 12, frameH: 10 },
    'bala-roja': one(P.enemyBulletRed()),
    'bala-cian': one(P.enemyBulletCyan()),
    'bala-cubito': one(P.makeIceCube()),
    'bola-escarcha': one(P.makeFrostBall()),
    'bala-tarjeta': { canvas: P.makeLoyaltyCard(), frameW: 10, frameH: 8 },
    'bala-factura': { canvas: P.makeInvoice(), frameW: 10, frameH: 10 },
    'bala-tuerca': { canvas: P.makeNut(), frameW: 9, frameH: 9 },
    'bala-confeti': { canvas: P.makeConfetti(), frameW: 7, frameH: 7 },
    'bala-tira': { canvas: P.makeShredStrip(), frameW: 9, frameH: 9 },
    'bala-folio': { canvas: P.makeSheet(), frameW: 9, frameH: 9 },
    'bala-tinta': { canvas: P.makeInkDrop(), frameW: 9, frameH: 9 },
    // The square of ink a DENEGADO stamp leaves on the floor.
    'tinta-denegado': { canvas: P.makeInkSquare(), frameW: 40, frameH: 26 },
    // The Muñeco de Moda's accessories: a shoe and a handbag, spinning (M10 5b).
    'bala-accesorio': { canvas: P.makeAccessory(), frameW: 9, frameH: 9 },
    // Its sale stickers, out of the box (M10 5c).
    'bala-pegatina': { canvas: P.makeSticker(), frameW: 9, frameH: 9 },
    'producto-caducado': { canvas: P.makeExpiredProducts(), frameW: 12, frameH: 14 },
    escarcha: { canvas: P.makeFrostPatch(), frameW: 46, frameH: 28 },
    fogonazo: { canvas: P.makeMuzzle(), frameW: 12, frameH: 10 },
    pelusa: { canvas: P.makePelusa(), frameW: 4, frameH: 4 },
    chispas: { canvas: P.makeSparks(), frameW: 2, frameH: 2 },
    polvo: { canvas: P.makePuff(), frameW: 8, frameH: 8 },
    mira: one(P.makeCrosshair()),
    corazones: { canvas: P.makeHearts(), frameW: 9, frameH: 8 },
    municion: { canvas: P.makeAmmoPip(), frameW: 4, frameH: 6 },
    vineta: one(P.makeVignette()),
    cupon: { canvas: P.makeCoupon(), frameW: 12, frameH: 9 },
    chatarra: { canvas: P.makeScrap(), frameW: 6, frameH: 6 },
    ranura: one(P.makeSlot()),
    despiece: { canvas: P.makeToasterBits(), frameW: 8, frameH: 8 },
    // Door shutters: in the back wall (north), the front wall (south) and the side walls.
    'persiana-n': { canvas: P.makeShutterFrames(48, 33), frameW: 48, frameH: 33 },
    'persiana-s': { canvas: P.makeShutterFrames(48, 24), frameW: 48, frameH: 24 },
    'persiana-v': { canvas: P.makeShutterFrames(24, 48), frameW: 24, frameH: 48 },
    'persiana-n-2': { canvas: P.makeShutterFrames(48, 33, 2), frameW: 48, frameH: 33 },
    'persiana-s-2': { canvas: P.makeShutterFrames(48, 24, 2), frameW: 48, frameH: 24 },
    'persiana-v-2': { canvas: P.makeShutterFrames(24, 48, 2), frameW: 24, frameH: 48 },
    'persiana-n-3': { canvas: P.makeShutterFrames(48, 33, 3), frameW: 48, frameH: 33 },
    'persiana-s-3': { canvas: P.makeShutterFrames(48, 24, 3), frameW: 48, frameH: 24 },
    'persiana-v-3': { canvas: P.makeShutterFrames(24, 48, 3), frameW: 24, frameH: 48 },
    'persiana-n-4': { canvas: P.makeShutterFrames(48, 33, 4), frameW: 48, frameH: 33 },
    'persiana-s-4': { canvas: P.makeShutterFrames(48, 24, 4), frameW: 48, frameH: 24 },
    'persiana-v-4': { canvas: P.makeShutterFrames(24, 48, 4), frameW: 24, frameH: 48 },
    'persiana-n-5': { canvas: P.makeShutterFrames(48, 33, 5), frameW: 48, frameH: 33 },
    'persiana-s-5': { canvas: P.makeShutterFrames(48, 24, 5), frameW: 48, frameH: 24 },
    'persiana-v-5': { canvas: P.makeShutterFrames(24, 48, 5), frameW: 24, frameH: 48 },
    'persiana-n-6': { canvas: P.makeShutterFrames(48, 33, 6), frameW: 48, frameH: 33 },
    'persiana-s-6': { canvas: P.makeShutterFrames(48, 24, 6), frameW: 48, frameH: 24 },
    'persiana-v-6': { canvas: P.makeShutterFrames(24, 48, 6), frameW: 24, frameH: 48 },
    montacargas: { canvas: P.makeGoodsLift(), frameW: 44, frameH: 34 },
    'montacargas-servicio': { canvas: P.makeServiceLift(), frameW: 44, frameH: 44 },
    'corazon-suelo': { canvas: P.makeSpareHeart(), frameW: 13, frameH: 12 },
    'garantia-provisional': { canvas: P.makeShieldPickup(), frameW: 13, frameH: 12 },
    'garantias-hud': { canvas: P.makeShieldHearts(), frameW: 9, frameH: 8 },
    'corazon-turbo': { canvas: P.makeTurboHeart(), frameW: 13, frameH: 12 },
    'corazon-sobretension': { canvas: P.makeSurgeHeart(), frameW: 13, frameH: 12 },
    'turbo-hud': { canvas: P.makeTurboHud(), frameW: 9, frameH: 8 },
    'sobretension-hud': { canvas: P.makeSurgeHud(), frameW: 9, frameH: 8 },
    cofre: { canvas: P.makeChest(), frameW: 26, frameH: 24 },
    'cofre-premium': { canvas: P.makeChest(true), frameW: 26, frameH: 24 },
    ticket: { canvas: P.makeTicket(), frameW: 9, frameH: 11 },
    rasca: { canvas: P.makeScratchCard(), frameW: 11, frameH: 13 },
    documento: one(P.makeStoryDoc()),
    autocobro: { canvas: P.makeSelfCheckout(), frameW: 30, frameH: 36 },
    expositor: one(P.makeShopStand()),
    // The Mostrador de Devoluciones (the hub): see tools/sprites/mostrador.ts.
    mostrador: { canvas: H.makeCounter(), frameW: 24, frameH: 30 },
    'caja-devoluciones': { canvas: H.makeReturnsTill(), frameW: 24, frameH: 46 },
    poste: one(H.makePost()),
    'cinta-cola': one(H.makeQueueTape()),
    turnos: { canvas: H.makeTicketMachine(), frameW: 16, frameH: 34 },
    archivador: one(H.makeFilingCabinet()),
    chatarrero: { canvas: H.makeScrapDealer(), frameW: 36, frameH: 36 },
    tablon: one(H.makeBoard()),
    'fichas-tablon': { canvas: H.makeBoardFaces(), frameW: 6, frameH: 7 },
    telefono: { canvas: H.makeWallPhone(), frameW: 18, frameH: 32 },
    'cita-previa': one(H.makeAppointmentNotice()),
    'cita-marcas': one(H.makeNoticeTicks()),
    'cita-sello': one(H.makeGrantedStamp()),
    'cinta-almacen': { canvas: H.makeConveyor(), frameW: 48, frameH: 24 },
    cortinas: { canvas: H.makeStripCurtain(), frameW: 48, frameH: 33 },
    'cartel-mercancia': one(H.makeReturnedGoodsSign()),
    // The true ending (M12 (5)): final.ts BOX_FRAMES names the box's frames.
    'final-caja': { canvas: strip(FN.makeEndingBox()), frameW: FN.BOX_W, frameH: FN.BOX_H },
    'final-pegatina': one(FN.makeEndingSticker()),
    'final-guante': { canvas: strip(FN.makeEndingGlove()), frameW: 34, frameH: 24 },
    'final-ducha': one(FN.makeEndingSprayBar()),
    'final-estanteria': one(FN.makeEndingShelf()),
  };
  for (const n of Object.keys(ITEM_GRIDS)) sheets['objeto-' + n] = one(makeItem(n));
  // M14c (a3): sprites made outside (art/entrada/), already in the palette; they only replace a
  // sheet drawn by code if their JSON says «reemplaza».
  Object.assign(sheets, incomingSheets(new Set(Object.keys(sheets))));
  return sheets;
}

function main(): void {
  const out = join(ROOT, 'public/assets');
  mkdirSync(out, { recursive: true });
  const manifest: Record<string, SheetInfo> = {};
  for (const [key, s] of Object.entries(allSheets())) {
    const file = `${key}.png`;
    writeFileSync(join(out, file), encodePng(s.canvas));
    manifest[key] = { file, frameW: s.frameW, frameH: s.frameH, frames: Math.floor(s.canvas.w / s.frameW) };
  }
  writeFileSync(join(out, 'sprites.json'), JSON.stringify(manifest, null, 2) + '\n');

  // Previews for checking by eye (not committed): capturas/sprites-*.png
  mkdirSync(join(ROOT, 'capturas'), { recursive: true });
  const sheets = allSheets();
  const sheet = new Canvas(400, 100, hx('#1a1e2b'));
  let x = 4;
  for (const k of ['tostadora', 'maniqui', 'aspirador', 'microondas', 'bombilla', 'polilla', 'batidora', 'mando']) {
    const c = sheets[k]!.canvas;
    sheet.blit(c, x, 96 - c.h);
    x += c.w + 4;
  }
  x = 4;
  const row = ['caja', 'barril', 'carrito', 'bala-jugador', 'bala-roja', 'bala-cubito', 'bola-escarcha', 'escarcha', 'fogonazo'];
  const row2 = ['pelusa', 'polvo', 'mira', 'corazones', 'municion', 'mano', 'arma-secador', 'arma-grapadora', 'arma-plancha', 'bala-grapa', 'bala-vapor'];
  for (const k of [...row, ...row2, 'cupon', 'chatarra', 'despiece', 'montacargas', 'montacargas-servicio', 'corazon-suelo',
    'garantia-provisional', 'garantias-hud', 'corazon-turbo', 'corazon-sobretension', 'turbo-hud', 'sobretension-hud', 'cofre', 'cofre-premium', 'ticket', 'rasca', 'autocobro', 'expositor']) {
    const c = sheets[k]!.canvas;
    sheet.blit(c, x, 4);
    x += c.w + 3;
  }
  writeFileSync(join(ROOT, 'capturas/sprites-hoja.png'), encodePng(scaled(sheet, 3)));
  const room = buildRoom(ROOMS['sala-pruebas']!);
  writeFileSync(join(ROOT, 'capturas/sprites-sala.png'), encodePng(paintRoom(room, 'preview').canvas));
  writeFileSync(join(ROOT, 'capturas/sprites-mostrador.png'), encodePng(scaled(H.previewHub(buildRoom(HUB), sheets, paintRoom), 2)));
  console.log(`${Object.keys(manifest).length} hojas de sprites en public/assets/.`);
}

if (import.meta.main) main();
