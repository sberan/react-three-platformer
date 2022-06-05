
import React, { useEffect } from "react"
import ReactDOM from "react-dom"
import { Canvas, useThree } from '@react-three/fiber'
import { Physics, Triplet, useBox, useSphere } from '@react-three/cannon'
import { distinctUntilChanged, filter, fromEvent, groupBy, interval, map, merge, mergeAll, mergeMap, takeUntil } from 'rxjs'


const Platform = (props: {x: number, y: number}) => {
  const size: Triplet = [1, .1, 1]
  const [ref] = useBox(() => ({ position: [props.x, props.y, 0], args: size  }))
  return <mesh ref={ref as any} receiveShadow>
    <boxGeometry args={size} />
    <meshStandardMaterial color="orange" />
  </mesh>
}

const Character = (props: {x: number, y: number}) => {
  const camera = useThree().camera
  const size = .1
  const [ref, sphere] = useSphere(() => ({ mass: 1, args: [size], position: [props.x, props.y, 0] }))

  useEffect(() => {
    return sphere.position.subscribe(([x, y]) => {
      camera.position.z = 3
      camera.position.y = 1
      camera.position.x = x
  
      if (y < -10) {
        sphere.sleep()
        sphere.position.set(props.x, props.y, 0)
        sphere.wakeUp()
      }
    })
  }, [])


  const thrust = (dir: { x?: number, y?: number}) => {
    const off = sphere.velocity.subscribe(([x, y, z]) => {
      if (dir.y === undefined || Math.abs(y) < 1) {
        sphere.velocity.set(x | (dir.x || 0), y + (dir.y || 0), z)
      }
      off()
    })
  }

  useEffect(() => {
    const keydowns = fromEvent<KeyboardEvent>(document, 'keydown').pipe(map(({ code }) => ({ type: 'down', code })))
    const keyups = fromEvent<KeyboardEvent>(document, 'keyup').pipe(map(({ code }) => ({ type: 'up', code })))
    
    const uniqueEvents = merge(keydowns, keyups)
      .pipe(
        groupBy(x => x.code),
        map(group => group.pipe(
          distinctUntilChanged((x, y) => x === y, x => x.type)),
        ),
        mergeAll(),
      )

    const subscription = uniqueEvents.pipe(filter(e => e.type === 'down'))
      .pipe(
        mergeMap(e => merge([e], interval(100)).pipe(
          map(() => e),
          takeUntil( uniqueEvents.pipe(filter(next => next.code === e.code && next.type === 'up'))))
        ))
      .subscribe(x => {
        if (x.code === 'ArrowUp') {
          thrust({ y: 5 })
        }
        if (x.code === 'ArrowLeft') {
          thrust({ x: -1 })
        }
        if (x.code === 'ArrowRight') {
          thrust({ x: 1 })
        }
      })
    
    return subscription.unsubscribe
  }, [])
  
  return <mesh ref={ref as any} castShadow>
    <sphereGeometry args={[size]}/>
    <meshStandardMaterial color={[1, 0.2, 0.2]}/>
  </mesh>
}

ReactDOM.render(
  <Canvas shadows>
    <ambientLight color={[1, 1, 1]} position={[ 0, 0, -5]} />
    <pointLight castShadow color={[1,0,0]} position={[0, 10, 0]} />
    <Physics>
      <Character x={0.2} y={1.5} />
      <Platform x={0.2} y={0} />
      <Platform x={1.3} y={.5} />
      <Platform x={2.5} y={1} />
    </Physics>
  </Canvas>,
  document.getElementById('root'),
)