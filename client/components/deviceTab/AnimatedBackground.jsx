import React, { useEffect, useRef } from "react"
import { View, StyleSheet, Dimensions, Animated } from "react-native"
import Svg, { Defs, Pattern, Path, Rect, Line, G } from "react-native-svg"

const { width, height } = Dimensions.get("window")

const AnimatedBackground = () => {
  const pulseAnim1 = useRef(new Animated.Value(0.3)).current
  const pulseAnim2 = useRef(new Animated.Value(0.5)).current
  const pulseAnim3 = useRef(new Animated.Value(0.2)).current

  useEffect(() => {
    const createPulseAnimation = (animValue, duration) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 0.8,
            duration: duration,
            useNativeDriver: true
          }),
          Animated.timing(animValue, {
            toValue: 0.3,
            duration: duration,
            useNativeDriver: true
          })
        ])
      )
    }

    const anim1 = createPulseAnimation(pulseAnim1, 4000)
    const anim2 = createPulseAnimation(pulseAnim2, 6000)
    const anim3 = createPulseAnimation(pulseAnim3, 3000)

    anim1.start()
    anim2.start()
    anim3.start()

    return () => {
      anim1.stop()
      anim2.stop()
      anim3.stop()
    }
  }, [])

  return (
    <View style={styles.container}>
      {/* Animated circles */}
      <Animated.View
        style={[
          styles.circle1,
          {
            opacity: pulseAnim1
          }
        ]}
      />
      <Animated.View
        style={[
          styles.circle2,
          {
            opacity: pulseAnim2
          }
        ]}
      />
      <Animated.View
        style={[
          styles.circle3,
          {
            opacity: pulseAnim3
          }
        ]}
      />

      {/* Grid pattern */}
      <Svg style={styles.svg} width={width} height={height}>
        <Defs>
          <Pattern
            id="grid"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <Path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="rgba(59, 130, 246, 0.1)"
              strokeWidth="1"
            />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#grid)" />

        {/* Connection lines */}
        <G opacity="0.3">
          <Line
            x1={width * 0.2}
            y1={height * 0.3}
            x2={width * 0.8}
            y2={height * 0.7}
            stroke="rgba(139, 69, 193, 0.3)"
            strokeWidth="2"
          />
          <Line
            x1={width * 0.1}
            y1={height * 0.6}
            x2={width * 0.9}
            y2={height * 0.4}
            stroke="rgba(59, 130, 246, 0.3)"
            strokeWidth="2"
          />
          <Line
            x1={width * 0.3}
            y1={height * 0.8}
            x2={width * 0.7}
            y2={height * 0.2}
            stroke="rgba(16, 185, 129, 0.3)"
            strokeWidth="2"
          />
        </G>
      </Svg>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  circle1: {
    position: "absolute",
    top: height * 0.25,
    left: width * 0.25,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(59, 130, 246, 0.1)"
  },
  circle2: {
    position: "absolute",
    top: height * 0.6,
    right: width * 0.25,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(139, 69, 193, 0.1)"
  },
  circle3: {
    position: "absolute",
    top: height * 0.1,
    right: width * 0.1,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(16, 185, 129, 0.1)"
  },
  svg: {
    position: "absolute",
    top: 0,
    left: 0
  }
})

export default AnimatedBackground
