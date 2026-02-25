import { useEffect, useRef } from 'react'

const NeuralBackground = () => {
    const canvasRef = useRef(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')

        let animationId
        let nodes = []

        const MINT = '#79C1B0'
        const NAVY = '#113255'
        const NODE_COUNT = 55

        const resize = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }

        const createNodes = () => {
            nodes = Array.from({ length: NODE_COUNT }, () => ({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                r: Math.random() * 2.5 + 1.5,
                color: Math.random() > 0.5 ? MINT : NAVY,
                alpha: Math.random() * 0.5 + 0.25,
            }))
        }

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            // Draw connections
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const dx = nodes[i].x - nodes[j].x
                    const dy = nodes[i].y - nodes[j].y
                    const dist = Math.sqrt(dx * dx + dy * dy)
                    if (dist < 160) {
                        const opacity = (1 - dist / 160) * 0.18
                        ctx.beginPath()
                        ctx.strokeStyle = nodes[i].color === MINT
                            ? `rgba(121, 193, 176, ${opacity})`
                            : `rgba(17, 50, 85, ${opacity})`
                        ctx.lineWidth = 1
                        ctx.moveTo(nodes[i].x, nodes[i].y)
                        ctx.lineTo(nodes[j].x, nodes[j].y)
                        ctx.stroke()
                    }
                }
            }

            // Draw nodes
            nodes.forEach(n => {
                ctx.beginPath()
                ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
                ctx.fillStyle = n.color === MINT
                    ? `rgba(121, 193, 176, ${n.alpha})`
                    : `rgba(17, 50, 85, ${n.alpha})`
                ctx.fill()

                // Update position
                n.x += n.vx
                n.y += n.vy
                if (n.x < 0 || n.x > canvas.width) n.vx *= -1
                if (n.y < 0 || n.y > canvas.height) n.vy *= -1
            })

            animationId = requestAnimationFrame(draw)
        }

        resize()
        createNodes()
        draw()

        window.addEventListener('resize', () => {
            resize()
            createNodes()
        })

        return () => {
            cancelAnimationFrame(animationId)
            window.removeEventListener('resize', resize)
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 0,
                pointerEvents: 'none',
            }}
        />
    )
}

export default NeuralBackground
