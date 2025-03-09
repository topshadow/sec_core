class JavaLikeSerializer {
    serialize(obj: any): string {
      return this.serializeValue(obj);
    }
  
    deserialize(str: string): any {
      const [value, _] = this.deserializeValue(str, 0);
      return value;
    }
  
    private serializeValue(value: any): string {
      if (value === null) {
        return 'n';
      } else if (typeof value === 'string') {
        return `s${value.length}:${value}`;
      } else if (typeof value === 'number') {
        return `i${value}`;
      } else if (typeof value === 'boolean') {
        return value ? 'tT' : 'tF';
      } else if (Array.isArray(value)) {
        const elements = value.map(v => this.serializeValue(v)).join('');
        return `a${value.length}:${elements}`;
      } else if (typeof value === 'object') {
        const entries = Object.entries(value).map(([k, v]) => 
          `${this.serializeValue(k)}${this.serializeValue(v)}`
        ).join('');
        return `o${Object.keys(value).length}:${entries}`;
      }
      throw new Error(`Unsupported type: ${typeof value}`);
    }
  
    private deserializeValue(str: string, index: number): [any, number] {
      const type = str[index];
      switch (type) {
        case 'n':
          return [null, index + 1];
        case 's': {
          const colonIndex = str.indexOf(':', index + 1);
          const length = parseInt(str.slice(index + 1, colonIndex));
          const value = str.slice(colonIndex + 1, colonIndex + 1 + length);
          return [value, colonIndex + 1 + length];
        }
        case 'i': {
          const endIndex = str.indexOf(':', index + 1);
          if (endIndex === -1) {
            return [parseInt(str.slice(index + 1)), str.length];
          }
          return [parseInt(str.slice(index + 1, endIndex)), endIndex];
        }
        case 't':
          return [str[index + 1] === 'T', index + 2];
        case 'a': {
          const colonIndex = str.indexOf(':', index + 1);
          const length = parseInt(str.slice(index + 1, colonIndex));
          const array = [];
          let currentIndex = colonIndex + 1;
          for (let i = 0; i < length; i++) {
            const [value, newIndex] = this.deserializeValue(str, currentIndex);
            array.push(value);
            currentIndex = newIndex;
          }
          return [array, currentIndex];
        }
        case 'o': {
          const colonIndex = str.indexOf(':', index + 1);
          const length = parseInt(str.slice(index + 1, colonIndex));
          const obj: Record<string, any> = {};
          let currentIndex = colonIndex + 1;
          for (let i = 0; i < length; i++) {
            const [key, keyIndex] = this.deserializeValue(str, currentIndex);
            const [value, valueIndex] = this.deserializeValue(str, keyIndex);
            obj[key] = value;
            currentIndex = valueIndex;
          }
          return [obj, currentIndex];
        }
        default:
          throw new Error(`Unsupported type: ${type} at index ${index}`);
      }
    }
  }
  
  // 使用示例
  const serializer = new JavaLikeSerializer();
  
  const testObj = {
    name: "Alice",
    age: 30,
    isStudent: false,
    grades: [95, 87, 92],
    address: {
      street: "123 Main St",
      city: "Anytown"
    }
  };
  
  const serialized = serializer.serialize(testObj);
  console.log("Serialized:", serialized);
  
  const deserialized = serializer.deserialize(serialized);
  console.log("Deserialized:", deserialized);
  