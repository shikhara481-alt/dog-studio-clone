import { useEffect, useMemo, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useAnimations, useGLTF, useTexture } from '@react-three/drei'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(useGSAP, ScrollTrigger)

const configureScene = (camera, gl) => {
  camera.position.z = 0.8
  gl.toneMapping = THREE.ReinhardToneMapping
  gl.outputColorSpace = THREE.SRGBColorSpace
}

const configureTexture = (texture, colorSpace) => {
  texture.flipY = false
  texture.colorSpace = colorSpace
  return texture
}

const Dog = ({ coatColor }) => {
  const model = useGLTF('/Models/dog.drc.glb')
  const { camera, gl } = useThree()
  const { actions } = useAnimations(model.animations, model.scene)

  useEffect(() => {
    configureScene(camera, gl)
  }, [camera, gl])

  useEffect(() => {
    actions['Take 001']?.play()
  }, [actions])

  const [normalMapTexture, matcapMapTexture, branchMapTexture, branchNormalMapTexture] = useTexture([
    '/Models/dog_normals.jpg',
    '/matcap/mat-2.png',
    '/Models/branches_diffuse.jpg',
    '/Models/branches_normals.jpg',
  ])

  const normalMap = configureTexture(normalMapTexture, THREE.NoColorSpace)
  const matcapTexture = configureTexture(matcapMapTexture, THREE.SRGBColorSpace)
  const branchMap = configureTexture(branchMapTexture, THREE.SRGBColorSpace)
  const branchNormalMap = configureTexture(branchNormalMapTexture, THREE.NoColorSpace)

  const dogMaterial = useMemo(() => new THREE.MeshMatcapMaterial({
    normalMap,
    matcap: matcapTexture,
    color: '#ffffff',
  }), [normalMap, matcapTexture])

  const branchMaterial = useMemo(() => new THREE.MeshMatcapMaterial({
    normalMap: branchNormalMap,
    map: branchMap,
  }), [branchNormalMap, branchMap])

  useEffect(() => {
    model.scene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      child.material = child.name.includes('DOG') ? dogMaterial : branchMaterial
    })
  }, [model.scene, dogMaterial, branchMaterial])

  useEffect(() => {
    const targetColor = new THREE.Color(coatColor)
    const tween = gsap.to(dogMaterial.color, {
      r: targetColor.r,
      g: targetColor.g,
      b: targetColor.b,
      duration: 0.55,
      ease: 'power2.out',
      overwrite: 'auto',
    })

    return () => tween.kill()
  }, [coatColor, dogMaterial])

  useEffect(() => () => dogMaterial.dispose(), [dogMaterial])
  useEffect(() => () => branchMaterial.dispose(), [branchMaterial])

  const dogModel = useRef(model)

  useGSAP(() => {
    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: '#section-1',
        endTrigger: '#section-3',
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
      },
    })

    timeline
      .to(dogModel.current.scene.position, { z: '-=0.75', y: '+=0.30' })
      .to(dogModel.current.scene.rotation, { x: `+=${Math.PI / 15}` })
      .to(dogModel.current.scene.rotation, { y: `-=${Math.PI}` }, 'third')
      .to(dogModel.current.scene.position, {
        x: '-=0.4',
        z: '+=0.6',
        y: '-=0.15',
      }, 'third')
  }, [])

  return (
    <>
      <primitive
        object={model.scene}
        position={[0.2, -0.55, 0]}
        rotation={[0, Math.PI / 3.4, 0]}
      />
      <directionalLight position={[0, 5, 5]} color={0xffffff} intensity={10} />
    </>
  )
}

export default Dog
