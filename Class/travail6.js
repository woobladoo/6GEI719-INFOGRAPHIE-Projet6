// This program was developped by Daniel Audet and uses the file "basic-objects-IFS.js"
// from http://math.hws.edu/eck/cs424/notes2013/19_GLSL.html
//
//  It has been adapted to be compatible with the "MV.js" library developped
//  for the book "Interactive Computer Graphics" by Edward Angel and Dave Shreiner.
//

"use strict";

var gl;   // The webgl context.
var canvas;

var CoordsLoc;       // Location of the coords attribute variable in the standard texture mappping shader program.
var NormalLoc;
var TexCoordLoc;

var ProjectionLoc;     // Location of the uniform variables in the standard texture mappping shader program.
var ModelviewLoc;
var NormalMatrixLoc;
var textureLoc;
var alphaLoc;
var renderingoptionLoc;


var skyboxLoc;
var projectionboxLoc;
var envbox;
var modelviewboxLoc;


var vcoordsboxLoc;     // Location of the coords attribute variable in the shader program used for texturing the environment box.
var vnormalboxLoc;
var vtexcoordboxLoc;

var projection;   //--- projection matrix
var modelview;    // modelview matrix
var flattenedmodelview;    //--- flattened modelview matrix

var normalMatrix = mat3();  //--- create a 3X3 matrix that will affect normals

var rotator;   // A SimpleRotator object to enable rotation by mouse dragging.

var sphere, cylinder, box, teapot, disk, torus, cone;  // model identifiers
var hemisphereinside, hemisphereoutside, thindisk;
var quartersphereinside, quartersphereoutside;

var prog, progbox;  // shader program identifier

var lightPosition = vec4(20.0, 20.0, 100.0, 1.0);

var lightAmbient = vec4(1.0, 1.0, 1.0, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var materialAmbient = vec4(0.0, 0.1, 0.3, 1.0);
var materialDiffuse = vec4(0.48, 0.55, 0.69, 1.0);
var materialSpecular = vec4(0.48, 0.55, 0.69, 1.0);
var materialShininess = 100.0;

var ambientProduct, diffuseProduct, specularProduct;
var ambientProductLoc, diffuseProductLoc, specularProductLoc;
var shininessLoc;

var texID = {}; // texture identifier
var texID2; //environmental texture identifier

var ntextures_tobeloaded = 0;
var ntextures_loaded = 0;

var img = new Array(6);
var ct = 0;

let arc170;
var texcounter = 0;
var texturelist = [];
var object;
var bbunit;

var theta = 0.1;
var theta2 = 0.01;

// Camera control parameters
var rotation = 0;
var deplacementx = 0;
var deplacementz = 0;

var step = 1.0;

var animated = true;

var jaune = [
    vec4(0.93, 0.85, 0.27, 1.0),
    vec4(0.48, 0.55, 0.69, 1.0),
    vec4(0.48, 0.55, 0.69, 1.0),
    100.0,
  ];

  var jaune2 = [
    vec4(0.71, 0.64, 0.05),
    vec4(0.48, 0.55, 0.69, 1.0),
    vec4(0.48, 0.55, 0.69, 1.0),
    100.0,
  ];

  var jaune3 = [
    vec4(0.84, 0.67, 0.04),
    vec4(0.48, 0.55, 0.69, 1.0),
    vec4(0.48, 0.55, 0.69, 1.0),
    100.0,
  ];

  var grispale= [
    vec4(0.1843, 0.1843, 0.1843),
    vec4(0.48, 0.55, 0.69, 1.0),
    vec4(0.48, 0.55, 0.69, 1.0),
    100.0,
  ];

  var grispale2= [
    vec4(0.45, 0.46, 0.48),
    vec4(0.4, 0.55, 0.69, 1.0),
    vec4(0.48, 0.55, 0.69, 1.0),
    100.0,
  ];

  var grisfonce= [
    vec4(0.20, 0.19, 0.17),
    vec4(0.48, 0.55, 0.69, 1.0),
    vec4(0.48, 0.55, 0.69, 1.0),
    100.0,
  ];

  var blanc= [
    vec4(1, 1, 1),
    vec4(0.48, 0.55, 0.69, 1.0),
    vec4(0.48, 0.55, 0.69, 1.0),
    100.0,
  ];

  var bleu= [
    vec4(0.53, 0.76, 0.92),
    vec4(0, 0, 0, 1.0),
    vec4(0, 0, 0, 1.0),
    100.0,
  ];

function setcolor(){
    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);
    gl.uniform4fv(gl.getUniformLocation(prog, "ambientProduct"), flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(prog, "diffuseProduct"), flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(prog, "specularProduct"), flatten(specularProduct));
    gl.uniform1f(gl.getUniformLocation(prog, "shininess"), materialShininess);
}


function render() {
    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //--- Get the rotation matrix obtained from the displacement of the mouse
    //---  (note: the matrix obtained is already "flattened" by the function getViewMatrix)
    
    var viewMatrix = flatten(mat4());
    viewMatrix[14] = 0;
    flattenedmodelview = flatten(viewMatrix);
    modelview = unflatten(flattenedmodelview);
    var initialmodelview = modelview;
    gl.useProgram(prog);

      
    initialmodelview = mult(initialmodelview, rotate(rotation, 0.0, 1.0, 0));
    modelview = initialmodelview;
  
    var i = 0;
    var x1, y1, z1;

    if (ntextures_loaded == ntextures_tobeloaded || texID2.isloaded == true) {
	
      //environnement
      gl.useProgram(progbox); // Select the shader program that is used for the environment box.
      gl.uniformMatrix4fv(projectionboxLoc, false, flatten(projection));
      gl.enableVertexAttribArray(vcoordsboxLoc);
      gl.disableVertexAttribArray(vnormalboxLoc);     // normals are not used for the box
      gl.disableVertexAttribArray(vtexcoordboxLoc);  // texture coordinates not used for the box

      //associate texture to "texture unit" 0
      
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, texID2);
      // Send texture number to sampler
      gl.uniform1i(skyboxLoc, 0);
      envbox.render();
      
      initialmodelview = mult(initialmodelview, translate(deplacementx, 0, deplacementz-60));


      // Partie centrale
    {
        //sphere base nez du vaisseau
        gl.useProgram(prog);

        gl.enableVertexAttribArray(CoordsLoc);
        gl.enableVertexAttribArray(NormalLoc);     // normals are not used for the box
        gl.enableVertexAttribArray(TexCoordLoc);  // texture coordinates not used for the box
        materialAmbient = grispale2[0];
        materialDiffuse = grispale2[1];
        materialSpecular = grispale2[2];
        materialShininess = 100.0;
        setcolor();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texID["texReactor3"]);
        gl.uniform1i(textureLoc, 0);
        gl.uniform1i(renderingoptionLoc, 2);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        modelview = initialmodelview;
        modelview = mult(modelview, translate(0, 1.0, 1.0));
        modelview = mult(modelview, rotate(0.0, 1.0, 0.0, 0));
        normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
        modelview = mult(modelview, scale(0.5, 0.15, 1.49));
        sphere.render();
        
        //sphere base nez du vaisseau droit

        gl.useProgram(prog);
        materialAmbient = grispale2[0];
        materialDiffuse = grispale2[1];
        materialSpecular = grispale2[2];
        materialShininess = 100.0;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texID["texReactor2"]);
        gl.uniform1i(textureLoc, 0);
        gl.uniform1i(renderingoptionLoc, 2);
        setcolor();
        modelview = initialmodelview;
        modelview = mult(modelview, translate(4, -0.1, 3.0));
        modelview = mult(modelview, rotate(-40.0, 0.0, 0.0, 1.0));
        normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
        modelview = mult(modelview, scale(0.3, 0.05, 1.0));
        sphere.render();

        //sphere base nez du vaisseau gauche
        modelview = initialmodelview;
        modelview = mult(modelview, translate(-4, -0.1, 3.0));
        modelview = mult(modelview, rotate(40.0, 0.0, 0.0, 1.0));
        normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
        modelview = mult(modelview, scale(0.3, 0.05, 1.0));
        sphere.render();

        //cylindre base cockpit du vaisseau
        
        modelview = initialmodelview;
        modelview = mult(modelview, translate(0, 2.0, -9.5));
        modelview = mult(modelview, rotate(0.0, 0.0, 0.0, 1.0));
        normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
        modelview = mult(modelview, scale(0.3, 0.4, 0.4));
        cylinder.render();

        //cylindre R2-D2

        modelview = initialmodelview;
        modelview = mult(modelview, translate(0, 4.5, -9.0));
        modelview = mult(modelview, rotate(90.0, 1.0, 0.0, 0.0));
        normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
        modelview = mult(modelview, scale(0.2, 0.2, 0.2));
        cylinder.render();

        //tête R2-D2
        {
        materialAmbient = blanc[0];
        materialDiffuse = blanc[1];
        materialSpecular = blanc[2];
        materialShininess = 100.0;
        setcolor();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texID["texR2d2"]);
        gl.uniform1i(textureLoc, 0);
        gl.uniform1i(renderingoptionLoc, 1);
        modelview = initialmodelview;
        modelview = mult(modelview, translate(0, 6.5, -9.0));
        modelview = mult(modelview, rotate(90.0, 1.0, 0.0, 0.0));
        normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
        modelview = mult(modelview, scale(0.16, 0.16, 0.16));
        sphere.render(); 
        modelview = initialmodelview;
        modelview = mult(modelview, translate(0, 6.8, -9.0));
        modelview = mult(modelview, rotate(90.0, 1.0, 0.0, 0.0));
        normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
        modelview = mult(modelview, scale(0.05, 0.05, 0.15));
        cylinder.render();

        //cylindre base en dessous gauche

        materialAmbient = grisfonce[0];
        materialDiffuse = grisfonce[1];
        materialSpecular = grisfonce[2];
        materialShininess = 100.0;

        setcolor();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texID["metal"]);
        gl.uniform1i(textureLoc, 0);
        gl.uniform1i(renderingoptionLoc, 2);

         modelview = initialmodelview;
         modelview = mult(modelview, translate(-3, -1.3, 3));
         modelview = mult(modelview, rotate(0.0, 0.0, 0.0, 1.0));
         normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
         modelview = mult(modelview, scale(0.12, 0.12, 0.8));
         cylinder.render();

         //cylindre base en dessous droit
         modelview = initialmodelview;
         modelview = mult(modelview, translate(3, -1.3, 3));
         modelview = mult(modelview, rotate(0.0, 0.0, 0.0, 1.0));
         normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
         modelview = mult(modelview, scale(0.12, 0.12, 0.8));
         cylinder.render();

         //box base en dessous milieu
         modelview = initialmodelview;
         modelview = mult(modelview, translate(0, -1.3, 3));
         modelview = mult(modelview, rotate(0.0, 0.0, 0.0, 1.0));
         normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
         modelview = mult(modelview, scale(0.4, 0.35, 1.60));
         box.render();

        //box base en dessous milieu
        modelview = initialmodelview;
        modelview = mult(modelview, translate(-2.3, -2.2, 3));
        modelview = mult(modelview, rotate(65.0, 0.0, 0.0, 1.0));
        normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
        modelview = mult(modelview, scale(0.13, 0.13, 1.60));
        box.render();

        //box base en dessous droit
        modelview = initialmodelview;
        modelview = mult(modelview, translate(2.3, -2.2, 3));
        modelview = mult(modelview, rotate(-65.0, 0.0, 0.0, 1.0));
        normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
        modelview = mult(modelview, scale(0.13, 0.13, 1.60));
        box.render();

        //détail nez gauche
        materialAmbient = grispale[0];
        materialDiffuse = grispale[1];
        materialSpecular = grispale[2];
        materialShininess = 100.0;

        setcolor();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texID["metal"]);
        gl.uniform1i(textureLoc, 0);
        gl.uniform1i(renderingoptionLoc, 2);

        modelview = initialmodelview;
        modelview = mult(modelview, translate(-2, 1.9, 7));
        modelview = mult(modelview, rotate(90.0, 1.0, 0.0, 0.0));
        normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
        modelview = mult(modelview, scale(0.025, 0.5, 0.04));
        hemisphereoutside.render();
        
         //détail nez droit

         materialAmbient = grispale[0];
         materialDiffuse = grispale[1];
         materialSpecular = grispale[2];
         materialShininess = 100.0;
 
         setcolor();
         gl.activeTexture(gl.TEXTURE0);
         gl.bindTexture(gl.TEXTURE_2D, texID["metal"]);
         gl.uniform1i(textureLoc, 0);

         modelview = initialmodelview;
         modelview = mult(modelview, translate(2, 1.9, 7));
         modelview = mult(modelview, rotate(90.0, 1.0, 0.0, 0.0));
         normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
         modelview = mult(modelview, scale(0.025, 0.5, 0.04));
         hemisphereoutside.render();
 
        //queue du vaisseau
        {
        //sphere pour cylindre
        materialAmbient = grispale2[0];
        materialDiffuse = grispale2[1];
        materialSpecular = grispale2[2];
        materialShininess = 100.0;
    
        setcolor();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texID["texReactor2"]);
        gl.uniform1i(textureLoc, 0);
        gl.uniform1i(renderingoptionLoc, 2);
        modelview = initialmodelview;
        modelview = mult(modelview, translate(0, 0.6, -5.0));
        modelview = mult(modelview, rotate(0.0, 0.0, 0.0, 1.0));
        normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
        modelview = mult(modelview, scale(0.25, 0.25, 0.4));
        sphere.render();

        //partie arriere cockpit
        materialAmbient = grispale2[0];
        materialDiffuse = grispale2[1];
        materialSpecular = grispale2[2];
        materialShininess = 100.0;
      
        setcolor();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texID["texReactor2"]);
        gl.uniform1i(textureLoc, 0);
        gl.uniform1i(renderingoptionLoc, 2);
        modelview = initialmodelview;
        modelview = mult(modelview, translate(0, 2.0, -13.0));
        modelview = mult(modelview, rotate(0, 1.0, 0.0, 0.0));
        normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
        modelview = mult(modelview, scale(0.3, 0.4, 0.42));
        quartersphereoutside.render();

        //partie arriere cockpit pointue
        modelview = initialmodelview;
        modelview = mult(modelview, translate(0, 2.8, -19.0));
        modelview = mult(modelview, rotate(180, 0.0, 1.0, 0.0));
        modelview = mult(modelview, rotate(9, 1.0, 0.0, 0.0));
        normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
        modelview = mult(modelview, scale(0.15, 0.15, 0.4));
        cone.render();

        //partie arriere queue pointue
        modelview = initialmodelview;
        modelview = mult(modelview, translate(0, 2.0, -27.2));
        modelview = mult(modelview, rotate(180, 0.0, 1.0, 0.0));
        normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
        modelview = mult(modelview, scale(0.15, 0.15, 2.15));
        cone.render();

        //partie arriere queue pointue BASE 1
        modelview = initialmodelview;
        modelview = mult(modelview, translate(0, 2.0, -17.0));
        modelview = mult(modelview, rotate(180, 0.0, 1.0, 0.0));
        normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
        modelview = mult(modelview, scale(0.3, 0.4, 0.35));
        cone.render();

        //partie arriere queue pointue BASE 2
        modelview = initialmodelview;
        modelview = mult(modelview, translate(0, 2.0, -22.0));
        modelview = mult(modelview, rotate(180, 0.0, 1.0, 0.0));
        normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
        modelview = mult(modelview, scale(0.2, 0.2, 1.0));
        cone.render();

        //partie arriere queue pointue BASE cube
        modelview = initialmodelview;
        modelview = mult(modelview, translate(0.5, 0.5, -22.0));
        modelview = mult(modelview, rotate(9, 1.0, 0.0, 0.0));
        modelview = mult(modelview, rotate(4, 0.0, 1.0, 0.0));
        normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
        modelview = mult(modelview, scale(0.05, 0.05, 1.7));
        box.render();

        //Siège haut
        gl.uniform1i(renderingoptionLoc, 0);
        modelview = initialmodelview;
        modelview = mult(modelview, translate(0, 2.4, -5.1));
        modelview = mult(modelview, rotate(0, 1.0, 0.0, 0.0));
        normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
        modelview = mult(modelview, scale(0.3, 0.51, 0.05));
        box.render();

        //Siège bas
        modelview = initialmodelview;
        modelview = mult(modelview, translate(0, 2.6, -5.1));
        modelview = mult(modelview, rotate(90, 1.0, 0.0, 0.0));
        normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
        modelview = mult(modelview, scale(0.3, 0.9, 0.05));
        box.render();

         //partie arriere queue pointue BASE cube gauche

         gl.activeTexture(gl.TEXTURE0);
         gl.bindTexture(gl.TEXTURE_2D, texID["texReactor2"]);
         gl.uniform1i(textureLoc, 0);
         gl.uniform1i(renderingoptionLoc, 2);
         modelview = initialmodelview;
         modelview = mult(modelview, translate(-0.5, 0.5, -22.0));
         modelview = mult(modelview, rotate(9, 1.0, 0.0, 0.0));
         modelview = mult(modelview, rotate(-4, 0.0, 1.0, 0.0));
         normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
         modelview = mult(modelview, scale(0.05, 0.05, 1.7));
         box.render();

         //partie arriere queue pointue BASE cube milieu
         modelview = initialmodelview;
         modelview = mult(modelview, translate(0, 0.8, -20.0));
         modelview = mult(modelview, rotate(6, 1.0, 0.0, 0.0));
         modelview = mult(modelview, rotate(180, 0.0, 1.0, 0.0));
         normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
         modelview = mult(modelview, scale(0.15, 0.15, 0.9));
         cone.render();

         //partie arriere INFÉRIEURE pointue
         materialAmbient = grisfonce[0];
        materialDiffuse = grisfonce[1];
        materialSpecular = grisfonce[2];
        materialShininess = 100.0;

        setcolor();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texID["metal"]);
        gl.uniform1i(textureLoc, 0);
         modelview = initialmodelview;
         modelview = mult(modelview, translate(0, -1.64, -8.0));
         modelview = mult(modelview, rotate(2, 1.0, 0.0, 0.0));
         modelview = mult(modelview, rotate(180, 0.0, 1.0, 0.0));
         normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
         modelview = mult(modelview, scale(0.3, 0.12, 0.4));
         cone.render();

        //cylindre base nez du vaisseau
        modelview = initialmodelview;
        modelview = mult(modelview, translate(0, 1.0, 4.0));
        modelview = mult(modelview, rotate(-90.0, 1.0, 0.0, 0));
        normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
        modelview = mult(modelview, scale(0.35, 1.1, 0.25));
        hemisphereoutside.render();

        }


        }
      
      
    }


{   //AILE DROITE

    //aile droite grise
    materialAmbient = grispale2[0];
    materialDiffuse = grispale2[1];
    materialSpecular = grispale2[2];
    materialShininess = 100.0;
    setcolor();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texID["metal"]);
    gl.uniform1i(textureLoc, 0);
    gl.uniform1i(renderingoptionLoc, 2);
    modelview = initialmodelview;
    modelview = mult(modelview, translate(8.0, 1.01, 12.0));
    modelview = mult(modelview, rotate(15.0, 0.0, 1.0, 0));
    normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
    modelview = mult(modelview, scale(1.5, 0.05, 0.3));
    box.render();

    //aile droite jaune

    materialAmbient = grispale2[0];
    materialDiffuse = grispale2[1];
    materialSpecular = grispale2[2];
    materialShininess = 100.0;
    setcolor();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texID["texReactor2"]);
    gl.uniform1i(textureLoc, 0);
    modelview = initialmodelview;
    modelview = mult(modelview, translate(7.0, 1.0, 9.8));
    modelview = mult(modelview, rotate(5.0, 0.0, 1.0, 0));
    normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
    modelview = mult(modelview, scale(1.8, 0.05, 0.48));
    box.render();

    //cylindre partie arrière
    modelview = initialmodelview;
    modelview = mult(modelview, translate(9.6, 1.0, 7.1));
    modelview = mult(modelview, rotate(95.0, 0.0, 1.0, 0));
    normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
    modelview = mult(modelview, scale(0.025, 0.025, 0.5));
    cylinder.render();

    //cylindre partie avant aile
    materialAmbient = grispale2[0];
    materialDiffuse = grispale2[1];
    materialSpecular = grispale2[2];
    materialShininess = 100.0;

    setcolor();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texID["metal"]);
    gl.uniform1i(textureLoc, 0);
    modelview = initialmodelview;
    modelview = mult(modelview, translate(8.5, 1.0, 13.2));
    modelview = mult(modelview, rotate(105.0, 0.0, 1.0, 0));
    normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
    modelview = mult(modelview, scale(0.025, 0.025, 0.75));
    cylinder.render();

    //triangle aile droite
    materialAmbient = grispale2[0];
    materialDiffuse = grispale2[1];
    materialSpecular = grispale2[2];
    materialShininess = 100.0;

    setcolor();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texID["texReactor2"]);
    gl.uniform1i(textureLoc, 0);
    modelview = initialmodelview;
    modelview = mult(modelview, translate(3.4, 1.0, 7.2));
    modelview = mult(modelview, rotate(35.0, 0.0, 1.0, 0));
    normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
    modelview = mult(modelview, scale(0.25, 0.0262, 0.4));
    sphere.render();  

    //réacteur droit
    {
        //base
        materialAmbient = grispale2[0];
        materialDiffuse = grispale2[1];
        materialSpecular = grispale2[2];
        materialShininess = 100.0;
    
        setcolor();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texID["texReactor"]);
        gl.uniform1i(textureLoc, 0);
    
        modelview = initialmodelview;
        modelview = mult(modelview, translate(16.6, 1.0, 9.8));
        modelview = mult(modelview, rotate(0.0, 0.0, 1.0, 0));
        normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
        modelview = mult(modelview, scale(0.2, 0.2, 0.55));
        cylinder.render();

        //cône arrière fat
        materialAmbient = grispale2[0];
        materialDiffuse = grispale2[1];
        materialSpecular = grispale2[2];
        materialShininess = 100.0;
    
        setcolor();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texID["texReactor2"]);
        gl.uniform1i(textureLoc, 0);
        modelview = initialmodelview;
        modelview = mult(modelview, translate(16.6, 1.0, 2.5));
        modelview = mult(modelview, rotate(180.0, 0.0, 1.0, 0));
        normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
        modelview = mult(modelview, scale(0.16, 0.16, 0.3));
        cone.render();

        //cône arrière slim
        modelview = initialmodelview;
        modelview = mult(modelview, translate(16.6, 1.0, 0));
        modelview = mult(modelview, rotate(180.0, 0.0, 1.0, 0));
        normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
        modelview = mult(modelview, scale(0.1, 0.1, 0.9));
        cone.render();

        //ring arrière
        materialAmbient = bleu[0];
        materialDiffuse = bleu[1];
        materialSpecular = bleu[2];
        materialShininess = 100.0;
    
        setcolor();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texID["white"]);
        gl.uniform1i(textureLoc, 0);
        gl.uniform1i(renderingoptionLoc, 0);
        modelview = initialmodelview;
        modelview = mult(modelview, translate(16.6, 1.0, 9.4));
        modelview = mult(modelview, rotate(0.0, 0.0, 1.0, 0));
        normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
        modelview = mult(modelview, scale(0.17, 0.17, 0.55));
        cylinder.render();

        //arrondie avant  
        materialAmbient = grispale2[0];
        materialDiffuse = grispale[1];
        materialSpecular = grispale[2];
        materialShininess = 100.0;
        gl.uniform1i(renderingoptionLoc, 2);
    
        setcolor();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texID["metal"]);
        gl.uniform1i(textureLoc, 0);
        modelview = initialmodelview;
        modelview = mult(modelview, translate(16.6, 1.0, 12.0));
        modelview = mult(modelview, rotate(0.0, 0.0, 1.0, 0));
        normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
        modelview = mult(modelview, scale(0.19, 0.19, 0.7));
        sphere.render();
        
        //ring jaune
        materialAmbient = bleu[0];
        materialDiffuse = bleu[1];
        materialSpecular = bleu[2];
        materialShininess = 100.0;
    
        setcolor();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texID["white"]);
        gl.uniform1i(textureLoc, 0);
        gl.uniform1i(renderingoptionLoc, 0);
        modelview = initialmodelview;
        modelview = mult(modelview, translate(16.6, 1.0, 10.2));
        modelview = mult(modelview, rotate(0.0, 0.0, 1.0, 0));
        normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
        modelview = mult(modelview, scale(0.17, 0.17, 0.55));
        cylinder.render();

    }

}

{   //AILE GAUCHE

    //aile gauche grise

    materialAmbient = grispale2[0];
    materialDiffuse = grispale2[1];
    materialSpecular = grispale2[2];
    materialShininess = 100.0;
    setcolor();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texID["metal"]);
    gl.uniform1i(textureLoc, 0);
    gl.uniform1i(renderingoptionLoc, 2);
    modelview = initialmodelview;
    modelview = mult(modelview, translate(-8.0, 1.01, 12.0));
    modelview = mult(modelview, rotate(-15.0, 0.0, 1.0, 0));
    normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
    modelview = mult(modelview, scale(1.5, 0.05, 0.3));
    box.render();	

    //aile gauche jaune

    materialAmbient = grispale2[0];
    materialDiffuse = grispale2[1];
    materialSpecular = grispale2[2];
    materialShininess = 100.0;
    setcolor();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texID["texReactor2"]);
    gl.uniform1i(textureLoc, 0);
    modelview = initialmodelview;
    modelview = mult(modelview, translate(-7.0, 1.0, 9.8));
    modelview = mult(modelview, rotate(-5.0, 0.0, 1.0, 0));
    normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
    modelview = mult(modelview, scale(1.8, 0.05, 0.48));
    box.render();

     //cylindre partie arrière
     modelview = initialmodelview;
     modelview = mult(modelview, translate(-9.6, 1.0, 7.1));
     modelview = mult(modelview, rotate(-95.0, 0.0, 1.0, 0));
     normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
     modelview = mult(modelview, scale(0.025, 0.025, 0.5));
     cylinder.render();
 
     //cylindre partie avant aile
    materialAmbient = grispale2[0];
    materialDiffuse = grispale2[1];
    materialSpecular = grispale2[2];
    materialShininess = 100.0;
    setcolor();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texID["metal"]);
    gl.uniform1i(textureLoc, 0);
     modelview = initialmodelview;
     modelview = mult(modelview, translate(-8.5, 1.0, 13.2));
     modelview = mult(modelview, rotate(-105.0, 0.0, 1.0, 0));
     normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
     modelview = mult(modelview, scale(0.025, 0.025, 0.75));
     cylinder.render();

    //triangle aile gauche
    materialAmbient = grispale2[0];
    materialDiffuse = grispale2[1];
    materialSpecular = grispale2[2];
    materialShininess = 100.0;
    setcolor();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texID["texReactor2"]);
    gl.uniform1i(textureLoc, 0);
    modelview = initialmodelview;
    modelview = mult(modelview, translate(-3.4, 1.0, 7.2));
    modelview = mult(modelview, rotate(-35.0, 0.0, 1.0, 0));
    normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
    modelview = mult(modelview, scale(0.25, 0.0262, 0.4));
    sphere.render();

    //réacteur gauche 
    {

         //base
         materialAmbient = grispale2[0];
         materialDiffuse = grispale2[1];
         materialSpecular = grispale2[2];
         materialShininess = 100.0;     
         setcolor();
         gl.activeTexture(gl.TEXTURE0);
         gl.bindTexture(gl.TEXTURE_2D, texID["texReactor"]);
         gl.uniform1i(textureLoc, 0);    
         modelview = initialmodelview;
         modelview = mult(modelview, translate(-16.6, 1.0, 9.8));
         modelview = mult(modelview, rotate(0.0, 0.0, 1.0, 0));
         normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
         modelview = mult(modelview, scale(0.2, 0.2, 0.55));
         cylinder.render();

         //cône arrière fat
         materialAmbient = grispale2[0];
         materialDiffuse = grispale2[1];
         materialSpecular = grispale2[2];
         materialShininess = 100.0;     
         setcolor();
         gl.activeTexture(gl.TEXTURE0);
         gl.bindTexture(gl.TEXTURE_2D, texID["texReactor2"]);
         gl.uniform1i(textureLoc, 0);
         modelview = initialmodelview;
         modelview = mult(modelview, translate(-16.6, 1.0, 2.5));
         modelview = mult(modelview, rotate(-180.0, 0.0, 1.0, 0));
         normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
         modelview = mult(modelview, scale(0.16, 0.16, 0.3));
         cone.render(); 

         //cône arrière slim
         modelview = initialmodelview;
         modelview = mult(modelview, translate(-16.6, 1.0, 0));
         modelview = mult(modelview, rotate(-180.0, 0.0, 1.0, 0));
         normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
         modelview = mult(modelview, scale(0.1, 0.1, 0.9));
         cone.render();
 
         //ring arrière
        materialAmbient = bleu[0];
        materialDiffuse = bleu[1];
        materialSpecular = bleu[2];
        materialShininess = 100.0;   
        setcolor();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texID["white"]);
        gl.uniform1i(textureLoc, 0);
        gl.uniform1i(renderingoptionLoc, 0);
         modelview = initialmodelview;
         modelview = mult(modelview, translate(-16.6, 1.0, 9.4));
         modelview = mult(modelview, rotate(0.0, 0.0, 1.0, 0));
         normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
         modelview = mult(modelview, scale(0.17, 0.17, 0.55));
         cylinder.render();
 
        //arrondie avant
        materialAmbient = grispale2[0];
        materialDiffuse = grispale[1];
        materialSpecular = grispale[2];
        materialShininess = 100.0;    
        setcolor();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texID["metal"]);
        gl.uniform1i(textureLoc, 0);
        gl.uniform1i(renderingoptionLoc, 2);
         modelview = initialmodelview;
         modelview = mult(modelview, translate(-16.6, 1.0, 12.0));
         modelview = mult(modelview, rotate(0.0, 0.0, 1.0, 0));
         normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
         modelview = mult(modelview, scale(0.19, 0.19, 0.7));
         sphere.render();

        //ring jaune
        materialAmbient = bleu[0];
        materialDiffuse = bleu[1];
        materialSpecular = bleu[2];
        materialShininess = 100.0;   
        setcolor();            
        gl.uniform1i(textureLoc, 0);
        gl.uniform1i(renderingoptionLoc, 0);
         modelview = initialmodelview;
         modelview = mult(modelview, translate(-16.6, 1.0, 10.2));
         modelview = mult(modelview, rotate(0.0, 0.0, 1.0, 0));
         normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
         modelview = mult(modelview, scale(0.17, 0.17, 0.55));
         cylinder.render();


    }
        //Planètes  
        {
            //Terre            
            theta = theta + 0.5;
            materialAmbient = grispale2[0];
            materialDiffuse = grispale[1];
            materialSpecular = grispale[2];
            materialShininess = 100.0;        
            setcolor();
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texID["terre"]); 
            gl.uniform1i(textureLoc, 0);
            gl.uniform1i(renderingoptionLoc, 1);
            modelview = initialmodelview;
            modelview = mult(modelview, translate(-55.6, 14.0, -140.0));
            modelview = mult(modelview, rotate(theta, 0.0, 1.0, 0));
            normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
            modelview = mult(modelview, scale(1.5, 1.5, 1.5));            
            sphere.render();
            
            //Lune
            theta2 = theta2 + 0.01;
            var thetasin = (60*Math.cos(theta2));
            var thetacos = (60*Math.sin(theta2));

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texID["lune"]); 
            gl.uniform1i(textureLoc, 0);
            gl.uniform1i(renderingoptionLoc, 1);
            modelview = initialmodelview;
            modelview = mult(modelview, translate(-55.6, 14.0, -140.0));
            modelview = mult(modelview, translate(thetasin, 0, thetacos));
            modelview = mult(modelview, rotate(0.0, 0.0, 1.0, 0));
            normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
            modelview = mult(modelview, scale(0.65, 0.65, 0.65));
            sphere.render();         
            
            //Venus
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texID["venus"]); 
            gl.uniform1i(textureLoc, 0);
            gl.uniform1i(renderingoptionLoc, 1);
            modelview = initialmodelview;
            modelview = mult(modelview, translate(-130.0, 14.0, -10.0));
            modelview = mult(modelview, rotate(theta, 0.0, 1.0, 0));
            normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
            modelview = mult(modelview, scale(3.3, 3.3, 3.3));
            sphere.render();       

        }

        //VAISSEAU OBJET
        {
            //vaisseau objet
        modelview = initialmodelview;
        modelview = mult(modelview, translate(-30.0, 40.0, -70.0));
        modelview = mult(modelview, rotate(40.0, 1.0, 1.0, 0));     
        normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
        modelview = mult(modelview, scale(2, 2, 2));
        object.render();

          //bbunit                        Enlever les commentaires de cette partie pour mettre un pilote au vaisseau. Réduit les performances.
        //modelview = initialmodelview;
        //modelview = mult(modelview, translate(0.0, 1.75, -3.0));
        //modelview = mult(modelview, rotate(0, 1.0, 1.0, 0));     
        //normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
        //modelview = mult(modelview, scale(0.03, 0.03, 0.03));
        //bbunit.render();
      

        }

        //cockpit
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		    gl.enable(gl.BLEND);
		    gl.depthMask(false);
        gl.uniform1f(alphaLoc, 0.5);        
        materialAmbient = grisfonce[0];
        materialDiffuse = grisfonce[1];
        materialSpecular = grisfonce[2];
        materialShininess = 100.0;       
        setcolor();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texID["glass"]);
        gl.uniform1i(textureLoc, 0);
        gl.uniform1i(renderingoptionLoc, 2);
        modelview = initialmodelview;
        modelview = mult(modelview, translate(0, 2.0, -5.5));
        modelview = mult(modelview, rotate(90, 1.0, 0.0, 0));
        normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
        modelview = mult(modelview, scale(0.3, 0.92, 0.4));
        quartersphereoutside.render();

        //Cube Maxime Simard
        gl.uniform1f(alphaLoc, 0.7);
        setcolor();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texID["maxime1"]); 
        gl.uniform1i(textureLoc, 0);
        gl.uniform1i(renderingoptionLoc, 1);
        modelview = initialmodelview;
        modelview = mult(modelview, translate(25.0, 14.0, -30.0));
        modelview = mult(modelview, rotate(180, 0.0, 1.0, 0));
        modelview = mult(modelview, rotate(90, 0.0, 0.0, 1));
        normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
        modelview = mult(modelview, scale(1, 1, 1));
        box.render();
        gl.disable(gl.BLEND);
		    gl.depthMask(true);
        
}
    
requestAnimFrame(render);

    }
      
    	}



function unflatten(matrix) {
    var result = mat4();
    result[0][0] = matrix[0]; result[1][0] = matrix[1]; result[2][0] = matrix[2]; result[3][0] = matrix[3];
    result[0][1] = matrix[4]; result[1][1] = matrix[5]; result[2][1] = matrix[6]; result[3][1] = matrix[7];
    result[0][2] = matrix[8]; result[1][2] = matrix[9]; result[2][2] = matrix[10]; result[3][2] = matrix[11];
    result[0][3] = matrix[12]; result[1][3] = matrix[13]; result[2][3] = matrix[14]; result[3][3] = matrix[15];

    return result;
}

function handleLoadedTexture(texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      texture.image
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  
    ntextures_loaded++;
  
    gl.bindTexture(gl.TEXTURE_2D, null);
  
    render(); // Call render function when the image has been loaded (to insure the model is displayed)
  }

  function handleLoadedTextureMap(texture) {

    ct++;
    if (ct == 6) {
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        var targets = [
           gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
           gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
           gl.TEXTURE_CUBE_MAP_POSITIVE_Z, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
        ];
        for (var j = 0; j < 6; j++) {
            gl.texImage2D(targets[j], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img[j]);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        }
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);

        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
    }
	  ntextures_loaded++;
    render();  // Call render function when the image has been loaded (to make sure the model is displayed)
}

function handleLoadedTextureFromObjFile(texturelist,Id) {
  gl.bindTexture(gl.TEXTURE_2D, texturelist[Id]);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texturelist[Id].image);
gl.generateMipmap( gl.TEXTURE_2D );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR );

ntextures_loaded++;
  render();  // Call render function when the image has been loaded (to insure the model is displayed)

  gl.bindTexture(gl.TEXTURE_2D, null);
}

function createModel(modelData) {
  var model = {};
  model.coordsBuffer = gl.createBuffer();
  model.normalBuffer = gl.createBuffer();
  model.textureBuffer = gl.createBuffer();
  model.indexBuffer = gl.createBuffer();
  model.count = modelData.indices.length;

  gl.bindBuffer(gl.ARRAY_BUFFER, model.coordsBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexPositions, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexNormals, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, model.textureBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexTextureCoords, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, modelData.indices, gl.STATIC_DRAW);

  model.render = function () {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.coordsBuffer);
      gl.vertexAttribPointer(CoordsLoc, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
      gl.vertexAttribPointer(NormalLoc, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.textureBuffer);
      gl.vertexAttribPointer(TexCoordLoc, 2, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

      gl.uniformMatrix4fv(ModelviewLoc, false, flatten(modelview));    //--- load flattened modelview matrix
      gl.uniformMatrix3fv(NormalMatrixLoc, false, flatten(normalMatrix));  //--- load flattened normal matrix

      gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
  }
  return model;
}

  
  function initTexture() {

    var urls = [
      "space/posx.png", "space/negx.jpg",
      "space/posy.png", "space/negy.png",
      "space/posz.jpg", "space/negz.jpg"
   ];

   texID2 = gl.createTexture();
   texID2.isloaded = false;  // this class member is created only to check if the image has been loaded

   for (var i = 0; i < 6; i++) {
    img[i] = new Image();
    img[i].onload = function () {  // this function is called when the image download is complete

        handleLoadedTextureMap(texID2);
    }
    img[i].src = urls[i];   // this line starts the image downloading thread
    ntextures_tobeloaded++;

}


    texID["terre"]= gl.createTexture();
    texID["terre"].image = new Image();
    texID["terre"].image.onload = function () {
    handleLoadedTexture(texID["terre"]);
    };

    texID["terre"].image.src = "./texture/terre11.jpg";
    ntextures_tobeloaded++;

    texID["white"]= gl.createTexture();
    texID["white"].image = new Image();
    texID["white"].image.onload = function () {
      handleLoadedTexture(texID["white"]);
    };
  
    texID["white"].image.src = "./texture/white.jpg";
    ntextures_tobeloaded++;

    texID["metal"]= gl.createTexture();
    texID["metal"].image = new Image();
    texID["metal"].image.onload = function () {
      handleLoadedTexture(texID["metal"]);
    };
  
    texID["metal"].image.src = "./texture/metal.jpg";
    ntextures_tobeloaded++;

    texID["texR2d2"]= gl.createTexture();
    texID["texR2d2"].image = new Image();
    texID["texR2d2"].image.onload = function () {
      handleLoadedTexture(texID["texR2d2"]);
    };
  
    texID["texR2d2"].image.src = "./texture/texR2d2.jpg";
    ntextures_tobeloaded++;

    texID["texReactor"]= gl.createTexture();
    texID["texReactor"].image = new Image();
    texID["texReactor"].image.onload = function () {
      handleLoadedTexture(texID["texReactor"]);
    };
  
    texID["texReactor"].image.src = "./texture/texReactor.jpg";
    ntextures_tobeloaded++;

    texID["glass"]= gl.createTexture();
    texID["glass"].image = new Image();
    texID["glass"].image.onload = function () {
      handleLoadedTexture(texID["glass"]);
    };
  
    texID["glass"].image.src = "./texture/glass.jpg";
    ntextures_tobeloaded++;

    texID["texReactor2"]= gl.createTexture();
    texID["texReactor2"].image = new Image();
    texID["texReactor2"].image.onload = function () {
      handleLoadedTexture(texID["texReactor2"]);
    };
  
    texID["texReactor2"].image.src = "./texture/texReactor2.jpg";
    ntextures_tobeloaded++;

    texID["texReactor3"]= gl.createTexture();
    texID["texReactor3"].image = new Image();
    texID["texReactor3"].image.onload = function () {
      handleLoadedTexture(texID["texReactor3"]);
    };
  
    texID["texReactor3"].image.src = "./texture/texReactor3.jpg";
    ntextures_tobeloaded++;

    texID["lune"]= gl.createTexture();
    texID["lune"].image = new Image();
    texID["lune"].image.onload = function () {
    handleLoadedTexture(texID["lune"]);
    };

    texID["lune"].image.src = "./texture/moon.jpg";
    ntextures_tobeloaded++;

    texID["maxime1"]= gl.createTexture();
    texID["maxime1"].image = new Image();
    texID["maxime1"].image.onload = function () {
    handleLoadedTexture(texID["maxime1"]);
    };

    texID["maxime1"].image.src = "./texture/maxime1.jpg";
    ntextures_tobeloaded++;
    
    texID["venus"]= gl.createTexture();
    texID["venus"].image = new Image();
    texID["venus"].image.onload = function () {
    handleLoadedTexture(texID["venus"]);
    };

    texID["venus"].image.src = "./texture/venus.jpg";
    ntextures_tobeloaded++;

    

  }

function extractNormalMatrix(matrix) { // This function computes the transpose of the inverse of 
    // the upperleft part (3X3) of the modelview matrix (see http://www.lighthouse3d.com/tutorials/glsl-tutorial/the-normal-matrix/ )

    var result = mat3();
    var upperleft = mat3();
    var tmp = mat3();

    upperleft[0][0] = matrix[0][0];  // if no scaling is performed, one can simply use the upper left
    upperleft[1][0] = matrix[1][0];  // part (3X3) of the modelview matrix
    upperleft[2][0] = matrix[2][0];

    upperleft[0][1] = matrix[0][1];
    upperleft[1][1] = matrix[1][1];
    upperleft[2][1] = matrix[2][1];

    upperleft[0][2] = matrix[0][2];
    upperleft[1][2] = matrix[1][2];
    upperleft[2][2] = matrix[2][2];

    tmp = matrixinvert(upperleft);
    result = transpose(tmp);

    return result;
}

function matrixinvert(matrix) {

    var result = mat3();

    var det = matrix[0][0] * (matrix[1][1] * matrix[2][2] - matrix[2][1] * matrix[1][2]) -
                 matrix[0][1] * (matrix[1][0] * matrix[2][2] - matrix[1][2] * matrix[2][0]) +
                 matrix[0][2] * (matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0]);

    var invdet = 1 / det;

    // inverse of matrix m
    result[0][0] = (matrix[1][1] * matrix[2][2] - matrix[2][1] * matrix[1][2]) * invdet;
    result[0][1] = (matrix[0][2] * matrix[2][1] - matrix[0][1] * matrix[2][2]) * invdet;
    result[0][2] = (matrix[0][1] * matrix[1][2] - matrix[0][2] * matrix[1][1]) * invdet;
    result[1][0] = (matrix[1][2] * matrix[2][0] - matrix[1][0] * matrix[2][2]) * invdet;
    result[1][1] = (matrix[0][0] * matrix[2][2] - matrix[0][2] * matrix[2][0]) * invdet;
    result[1][2] = (matrix[1][0] * matrix[0][2] - matrix[0][0] * matrix[1][2]) * invdet;
    result[2][0] = (matrix[1][0] * matrix[2][1] - matrix[2][0] * matrix[1][1]) * invdet;
    result[2][1] = (matrix[2][0] * matrix[0][1] - matrix[0][0] * matrix[2][1]) * invdet;
    result[2][2] = (matrix[0][0] * matrix[1][1] - matrix[1][0] * matrix[0][1]) * invdet;

    return result;
}

// The following function is used to create an "object" (called "model") containing all the informations needed
// to draw a particular element (sphere, cylinder, cube,...). 
// Note that the function "model.render" is defined inside "createModel" but it is NOT executed.
// That function is only executed when we call it explicitly in render().

function createModel(modelData) {

	// the next line defines an "object" in Javascript
	// (note that there are several ways to define an "object" in Javascript)
	var model = {};
	
	// the following lines defines "members" of the "object"
    model.coordsBuffer = gl.createBuffer();
    model.normalBuffer = gl.createBuffer();
    model.textureBuffer = gl.createBuffer();
    model.indexBuffer = gl.createBuffer();
    model.count = modelData.indices.length;

	// the "members" are then used to load data from "modelData" in the graphic card
    gl.bindBuffer(gl.ARRAY_BUFFER, model.coordsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexPositions, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexNormals, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, model.textureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexTextureCoords, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, modelData.indices, gl.STATIC_DRAW);

	// The following function is NOT executed here. It is only DEFINED to be used later when we
	// call the ".render()" method.
    model.render = function () {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.coordsBuffer);
        gl.vertexAttribPointer(CoordsLoc, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.vertexAttribPointer(NormalLoc, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.textureBuffer);
        gl.vertexAttribPointer(TexCoordLoc, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

        gl.uniformMatrix4fv(ModelviewLoc, false, flatten(modelview));    //--- load flattened modelview matrix
        gl.uniformMatrix3fv(NormalMatrixLoc, false, flatten(normalMatrix));  //--- load flattened normal matrix

        gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);

    }
	
	// we now return the "object".
    return model;
}

function createModelFromObjFile(ptr) {
	
	var i;
    var model = {};
	
	model.numberofelements = ptr.numberofelements;
	model.coordsBuffer = [];
	model.normalBuffer = [];
	model.textureBuffer = [];
	model.indexBuffer = [];
	model.count = [];
	model.Ka = [];
	model.Kd = [];
	model.Ks = [];
	model.Ns = [];
	model.textureFile = [];
	model.texId = [];

	
	for(i=0; i < ptr.numberofelements; i++){
	
		model.coordsBuffer.push( gl.createBuffer() );
		model.normalBuffer.push( gl.createBuffer() );
		model.textureBuffer.push( gl.createBuffer() );
		model.indexBuffer.push( gl.createBuffer() );
		model.count.push( ptr.list[i].indices.length );
	
		gl.bindBuffer(gl.ARRAY_BUFFER, model.coordsBuffer[i]);
		gl.bufferData(gl.ARRAY_BUFFER, ptr.list[i].vertexPositions, gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer[i]);
		gl.bufferData(gl.ARRAY_BUFFER, ptr.list[i].vertexNormals, gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, model.textureBuffer[i]);
		gl.bufferData(gl.ARRAY_BUFFER, ptr.list[i].vertexTextureCoords, gl.STATIC_DRAW);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer[i]);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, ptr.list[i].indices, gl.STATIC_DRAW);
		
		model.Ka.push(ptr.list[i].material.Ka);
		model.Kd.push(ptr.list[i].material.Kd);
		model.Ks.push(ptr.list[i].material.Ks);
		model.Ns.push(ptr.list[i].material.Ns);  // shininess
		
		// if a texture file has been defined for this element
		if(ptr.list[i].material.map != ""){
			
			// Check if the filename is present in the texture list
			var texindex = model.textureFile.indexOf(ptr.list[i].material.map);
			if( texindex > -1){ // texture file previously loaded
				// store the texId of the previously loaded file
				model.texId.push(model.texId[texindex]);
			}
			else { // new texture file to load
				// store current texture counter (will be used when rendering the scene)
				model.texId.push(texcounter);
			
				// add a new image buffer to the texture list
				texturelist.push(gl.createTexture());
				if(texcounter < 70){
					texturelist[texcounter].image = new Image();
					
					if(texcounter == 0){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,0)
						}
					}
					else if(texcounter == 1){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,1)
						}
					}
					else if(texcounter == 2){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,2)
						}
					}
					else if(texcounter == 3){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,3)
						}
					}
					else if(texcounter == 4){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,4)
						}
					}
					else if(texcounter == 5){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,5)
						}
					}
					else if(texcounter == 6){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,6)
						}
					}
					else if(texcounter == 7){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,7)
						}
					}
					else if(texcounter == 8){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,8)
						}
					}
					else if(texcounter == 9){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,9)
						}
					}
					else if(texcounter == 10){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,10)
						}
					}
					else if(texcounter == 11){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,11)
						}
					}
					else if(texcounter == 12){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,12)
						}
					}
					else if(texcounter == 13){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,13)
						}
					}
					else if(texcounter == 14){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,14)
						}
					}
					else if(texcounter == 15){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,15)
						}
					}
					else if(texcounter == 16){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,16)
						}
					}
					else if(texcounter == 17){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,17)
						}
					}
					else if(texcounter == 18){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,18)
						}
					}
					else if(texcounter == 19){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,19)
						}
					}
					else if(texcounter == 20){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,20)
						}
					}
					else if(texcounter == 21){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,21)
						}
					}
					else if(texcounter == 22){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,22)
						}
					}
					else if(texcounter == 23){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,23)
						}
					}
					else if(texcounter == 24){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,24)
						}
					}
					else if(texcounter == 25){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,25)
						}
					}
					else if(texcounter == 26){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,26)
						}
					}
					else if(texcounter == 27){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,27)
						}
					}
					else if(texcounter == 28){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,28)
						}
					}
					else if(texcounter == 29){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,29)
						}
					}
					else if(texcounter == 30){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,30)
						}
					}
					else if(texcounter == 31){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,31)
						}
					}
					else if(texcounter == 32){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,32)
						}
					}
					else if(texcounter == 33){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,33)
						}
					}
					else if(texcounter == 34){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,34)
						}
					}
					else if(texcounter == 35){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,35)
						}
					}
					else if(texcounter == 36){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,36)
						}
					}
					else if(texcounter == 37){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,37)
						}
					}
					else if(texcounter == 38){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,38)
						}
					}
					else if(texcounter == 39){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,39)
						}
					}
					else if(texcounter == 40){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,40)
						}
					}
					else if(texcounter == 41){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,41)
						}
					}
					else if(texcounter == 42){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,42)
						}
					}
					else if(texcounter == 43){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,43)
						}
					}
					else if(texcounter == 44){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,44)
						}
					}
					else if(texcounter == 45){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,45)
						}
					}
					else if(texcounter == 46){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,46)
						}
					}
					else if(texcounter == 47){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,47)
						}
					}
					else if(texcounter == 48){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,48)
						}
					}
					else if(texcounter == 49){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,49)
						}
					}
					else if(texcounter == 50){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,50)
						}
					}
					else if(texcounter == 51){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,51)
						}
					}
					else if(texcounter == 52){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,52)
						}
					}
					else if(texcounter == 53){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,53)
						}
					}
					else if(texcounter == 54){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,54)
						}
					}
					else if(texcounter == 55){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,55)
						}
					}
					else if(texcounter == 56){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,56)
						}
					}
					else if(texcounter == 57){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,57)
						}
					}
					else if(texcounter == 58){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,58)
						}
					}
					else if(texcounter == 59){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,59)
						}
					}
					else if(texcounter == 60){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,60)
						}
					}
					else if(texcounter == 61){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,61)
						}
					}
					else if(texcounter == 62){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,62)
						}
					}
					else if(texcounter == 63){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,63)
						}
					}
					else if(texcounter == 64){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,64)
						}
					}
					else if(texcounter == 65){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,65)
						}
					}
					else if(texcounter == 66){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,66)
						}
					}
					else if(texcounter == 67){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,67)
						}
					}
					else if(texcounter == 68){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,68)
						}
					}
					else if(texcounter == 69){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,69)
						}
					}
					
					if(texcounter < 70){
						texturelist[texcounter].image.src = ptr.list[i].material.map;
						ntextures_tobeloaded++;					
					}

					// increment counter
					texcounter ++;
				} // if(texcounter<70)
			} // else				
		} // if(ptr.list[i].material.map != ""){
		else { // if there is no texture file associated to this element
			// store a null value (it will NOT be used when rendering the scene)
			model.texId.push(null);
		}
			
		// store the filename for every element even if it is empty ("")
		model.textureFile.push(ptr.list[i].material.map);		
		
	} // for(i=0; i < ptr.numberofelements; i++){
	
	model.render = function () {
		for(i=0; i < this.numberofelements; i++){
			
			gl.bindBuffer(gl.ARRAY_BUFFER, this.coordsBuffer[i]);
			gl.vertexAttribPointer(CoordsLoc, 3, gl.FLOAT, false, 0, 0);
			gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer[i]);
			gl.vertexAttribPointer(NormalLoc, 3, gl.FLOAT, false, 0, 0);
			gl.bindBuffer(gl.ARRAY_BUFFER, this.textureBuffer[i]);
			gl.vertexAttribPointer(TexCoordLoc, 2, gl.FLOAT, false, 0, 0);

			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer[i]);

			gl.uniformMatrix4fv(ModelviewLoc, false, flatten(modelview));    //--- load flattened modelview matrix
			gl.uniformMatrix3fv(NormalMatrixLoc, false, flatten(normalMatrix));  //--- load flattened normal matrix

			ambientProduct = mult(lightAmbient, vec4(this.Ka[i],1.0));
			diffuseProduct = mult(lightDiffuse, vec4(this.Kd[i],1.0));
			specularProduct = mult(lightSpecular, vec4(this.Ks[i],1.0));
			materialShininess = this.Ns[i];

			gl.uniform4fv(ambientProductLoc, flatten(ambientProduct));
			gl.uniform4fv(diffuseProductLoc, flatten(diffuseProduct));
			gl.uniform4fv(specularProductLoc, flatten(specularProduct));
			gl.uniform1f(shininessLoc, materialShininess);

			if(this.textureFile[i] != ""){
				gl.enableVertexAttribArray(TexCoordLoc);				
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, texturelist[model.texId[i]]);
			
				// Send texture number to sampler
				gl.uniform1i(textureLoc, 0);
				
				// assign "2" to renderingoption in fragment shader
				gl.uniform1i(renderingoptionLoc, 2);
			}
			else{
				gl.disableVertexAttribArray(TexCoordLoc);
				// assign "0" to renderingoption in fragment shader
				gl.uniform1i(renderingoptionLoc, 0);				
			}
			
			gl.drawElements(gl.TRIANGLES, this.count[i], gl.UNSIGNED_SHORT, 0);
		}
	}
	
    return model;
}

function createProgram(gl, vertexShaderSource, fragmentShaderSource) {
    var vsh = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsh, vertexShaderSource);
    gl.compileShader(vsh);
    if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
        throw "Error in vertex shader:  " + gl.getShaderInfoLog(vsh);
    }
    var fsh = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsh, fragmentShaderSource);
    gl.compileShader(fsh);
    if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
        throw "Error in fragment shader:  " + gl.getShaderInfoLog(fsh);
    }
    var prog = gl.createProgram();
    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw "Link error in program:  " + gl.getProgramInfoLog(prog);
    }
    return prog;
}


function getTextContent(elementID) {
    var element = document.getElementById(elementID);
    var fsource = "";
    var node = element.firstChild;
    var str = "";
    while (node) {
        if (node.nodeType == 3) // this is a text node
            str += node.textContent;
        node = node.nextSibling;
    }
    return str;
}

function createModelbox(modelData) {  // For creating the environment box.

  gl.useProgram(progbox);
  var model = {};
  model.coordsBuffer = gl.createBuffer();
  model.indexBuffer = gl.createBuffer();
  model.count = modelData.indices.length;
  gl.bindBuffer(gl.ARRAY_BUFFER, model.coordsBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexPositions, gl.STATIC_DRAW);
  console.log(modelData.vertexPositions.length);
  console.log(modelData.indices.length);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, modelData.indices, gl.STATIC_DRAW);
  model.render = function () {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.coordsBuffer);
      gl.vertexAttribPointer(vcoordsboxLoc, 3, gl.FLOAT, false, 0, 0);
      gl.uniformMatrix4fv(modelviewboxLoc, false, flatten(modelview));
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
      gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
  }
  return model;
}

window.onload = function init() {
    try {
        canvas = document.getElementById("glcanvas");
        gl = canvas.getContext("webgl");
        if (!gl) {
            gl = canvas.getContext("experimental-webgl");
        }
        if (!gl) {
            throw "Could not create WebGL context.";
        }

        // LOAD SHADER (standard texture mapping)
        var vertexShaderSource = getTextContent("vshader");
        var fragmentShaderSource = getTextContent("fshader");
        prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);
        gl.useProgram(prog);
        initTexture();
        //initKeyboardCallback();
        

        // locate variables for further use
        CoordsLoc = gl.getAttribLocation(prog, "vcoords");
        NormalLoc = gl.getAttribLocation(prog, "vnormal");
        TexCoordLoc = gl.getAttribLocation(prog, "vtexcoord");

        ModelviewLoc = gl.getUniformLocation(prog, "modelview");
        ProjectionLoc = gl.getUniformLocation(prog, "projection");
        NormalMatrixLoc = gl.getUniformLocation(prog, "normalMatrix");
        textureLoc = gl.getUniformLocation(prog, "texture");
        alphaLoc = gl.getUniformLocation(prog, "alpha");
        renderingoptionLoc = gl.getUniformLocation(prog, "renderingoption");

        var vertexShaderSource = getTextContent("vshaderbox");
        var fragmentShaderSource = getTextContent("fshaderbox");
        progbox = createProgram(gl, vertexShaderSource, fragmentShaderSource);
        gl.useProgram(progbox);

        vcoordsboxLoc = gl.getAttribLocation(progbox, "vcoords");
        vnormalboxLoc = gl.getAttribLocation(progbox, "vnormal");
        vtexcoordboxLoc = gl.getAttribLocation(progbox, "vtexcoord");

        modelviewboxLoc = gl.getUniformLocation(progbox, "modelview");
        projectionboxLoc = gl.getUniformLocation(progbox, "projection");

        skyboxLoc = gl.getUniformLocation(progbox, "skybox");

        gl.enableVertexAttribArray(CoordsLoc);
        gl.enableVertexAttribArray(NormalLoc);
		    gl.enableVertexAttribArray(TexCoordLoc);  // we do not need texture coordinates

        gl.enable(gl.DEPTH_TEST);

        initTexture();

        gl.useProgram(prog);

        //  create a "rotator" monitoring mouse mouvement
        //rotator = new SimpleRotator(canvas, null);
        //  set initial camera position at z=40, with an "up" vector aligned with y axis
        //   (this defines the initial value of the modelview matrix )
        //rotator.setView([0, 0, 1], [0, 1, 0], 40);

        ambientProduct = mult(lightAmbient, materialAmbient);
        diffuseProduct = mult(lightDiffuse, materialDiffuse);
        specularProduct = mult(lightSpecular, materialSpecular);
		
		gl.uniform4fv(gl.getUniformLocation(prog, "ambientProduct"), flatten(ambientProduct));
		gl.uniform4fv(gl.getUniformLocation(prog, "diffuseProduct"), flatten(diffuseProduct));
		gl.uniform4fv(gl.getUniformLocation(prog, "specularProduct"), flatten(specularProduct));
		gl.uniform1f(gl.getUniformLocation(prog, "shininess"), materialShininess);
		gl.uniform4fv(gl.getUniformLocation(prog, "lightPosition"), flatten(lightPosition));

		projection = perspective(70.0, 1.0, 1.0, 2000.0);
		gl.uniformMatrix4fv(ProjectionLoc, false, flatten(projection));  // send projection matrix to the shader program
    gl.useProgram(progbox);
    gl.uniformMatrix4fv(projectionboxLoc, false, flatten(projection));
		
		// In the following lines, we create different "elements" (sphere, cylinder, box, disk,...).
		// These elements are "objects" returned by the "createModel()" function.
		// The "createModel()" function requires one parameter which contains all the information needed
		// to create the "object". The functions "uvSphere()", "uvCylinder()", "cube()",... are described
		// in the file "basic-objects-IFS.js". They return an "object" containing vertices, normals, 
		// texture coordinates and indices.
		// 
		gl.useProgram(prog);

    sphere = createModel(uvSphere(10.0, 25.0, 25.0));
    cylinder = createModel(uvCylinder(10.0, 20.0, 25.0, false, false));
    box = createModel(cube(10.0));    
    object = createModelFromObjFile(ExtractDataFromOBJ("star-wars-arc-170-pbr.obj"));
    bbunit = createModelFromObjFile(ExtractDataFromOBJ("bb-unit.obj"));
		teapot = createModel(teapotModel);
    disk = createModel(ring(5.0, 10.0, 25.0));
    torus = createModel(uvTorus(15.0, 5.0, 25.0, 25.0));
    cone = createModel(uvCone(10.0, 20.0, 25.0, true));
		hemisphereinside = createModel(uvHemisphereInside(10.0, 25.0, 25.0));
		hemisphereoutside = createModel(uvHemisphereOutside(10.0, 25.0, 25.0));
    thindisk = createModel(ring(9.5, 10.0, 25.0));
		quartersphereinside = createModel(uvQuartersphereInside(10.0, 25.0, 25.0));
		quartersphereoutside = createModel(uvQuartersphereOutside(10.0, 25.0, 25.0));
    envbox = createModelbox(cube(1000.0));

		// managing arrow keys (to move up or down the model)
		document.onkeydown = function (e) {
			switch (e.key) {
				case 'e':
					// resize the canvas to the current window width and height
					resize(canvas);
					break;
        case "ArrowLeft": // Use left arrow to move the camera to the left.  
            rotation -= step; 
            break;
        case "ArrowUp": // Use up arrow to move the camera forward. 
            deplacementz  += step * Math.cos(rotation * (Math.PI / 180));
            deplacementx  -= step * Math.sin(rotation * (Math.PI / 180));
            printf(deplacementz)

              break;
        case "ArrowRight": // Use right arrow to move the camera to the right. 
            rotation += step;
            break; 
        case "ArrowDown": // Use down arrow to move the camera backward.  
            deplacementz  -= step * Math.cos(rotation * (Math.PI / 180));
            deplacementx  += step * Math.sin(rotation * (Math.PI / 180));
            break;
        default: return;
			}
		};

    }
    catch (e) {
        alert("Could not initialize WebGL: " + e);           
        return;
    }

	window.addEventListener("resize", onresize);
  
	
   	onresize();  // size the canvas to the current window width and height

    
}

function onresize() {  // ref. https://webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
  var realToCSSPixels = window.devicePixelRatio;

  var actualPanelWidth = Math.floor(window.innerWidth * 0.85);  // note that right panel is 85% of window width 
  var actualPanelHeight = Math.floor(window.innerHeight - 30);
  
  var minDimension = Math.min(actualPanelWidth, actualPanelHeight);
    
   // Ajust the canvas to this dimension (square)
    canvas.width  = minDimension;
    canvas.height = minDimension;
	
	gl.viewport(0, 0, canvas.width, canvas.height);

}



